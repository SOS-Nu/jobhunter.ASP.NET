// src/pages/user/public-cv.tsx

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactDOM from "react-dom/client";
import moment from "moment";

// ✅ BƯỚC 1: Import thư viện mới
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// UI Components
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Image,
  Modal,
} from "react-bootstrap";
import { Spin, notification, Result, Tag } from "antd";
import {
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  DownloadOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";

// API & Types
import { callFetchUserDetailById } from "@/config/api";
import { IUser } from "@/types/backend";
import classicCv from "@/assets/cv/classicCV.png";
import modermCv from "@/assets/cv/modermCv.png";

// PDF Templates
import CVTemplate_Modern from "./CVTemplate_Modern";
import CVTemplate_Classic from "./CVTemplate_Classic";

// Styles
import "@/styles/stylespotfolio/public-cv.scss";
import hero from "assets/hero.svg";

const PublicCvPage = () => {
  // === STATE MANAGEMENT ===
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [userData, setUserData] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isDownloading, setIsDownloading] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // === TEMPLATE CONFIG ===
  const templates = [
    { name: "Classic", preview: classicCv },
    { name: "Modern", preview: modermCv },
  ];

  // === DATA FETCHING ===
  useEffect(() => {
    const fetchUserData = async () => {
      if (!id) {
        setError("User ID is missing.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const res = await callFetchUserDetailById(id);
        if (res && res.data) {
          setUserData(res.data);
        } else {
          setError("User not found or has a private profile.");
        }
      } catch (e) {
        setError("Failed to fetch data. Please try again later.");
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [id]);

  // === HELPER FUNCTIONS ===
  const getAvatarUrl = (avatarPath?: string | null) => {
    if (avatarPath) {
      return `${import.meta.env.VITE_BACKEND_URL}/storage/avatar/${avatarPath}`;
    }
    return `https://ui-avatars.com/api/?name=${userData?.name || "User"}&background=random&color=fff`;
  };

  // === PDF EXPORT LOGIC ===
  // ✅ BƯỚC 2: Cập nhật hoàn toàn logic hàm handleDownloadPdf
  const handleDownloadPdf = async (templateName: string) => {
    if (!userData || !userData.onlineResume) return;

    setShowTemplateModal(false);
    setIsDownloading(true);

    // Tạo container ẩn để render component CV
    const pdfContainer = document.createElement("div");
    pdfContainer.style.position = "absolute";
    pdfContainer.style.left = "-9999px"; // Di chuyển ra ngoài màn hình
    pdfContainer.style.top = "0";
    document.body.appendChild(pdfContainer);

    const root = ReactDOM.createRoot(pdfContainer);
    const avatarUrl = getAvatarUrl(userData.avatar);

    let templateToRender;
    switch (templateName) {
      case "Modern":
        templateToRender = (
          <CVTemplate_Modern userData={userData} avatarUrl={avatarUrl} />
        );
        break;
      case "Classic":
      default:
        templateToRender = (
          <CVTemplate_Classic userData={userData} avatarUrl={avatarUrl} />
        );
        break;
    }

    root.render(templateToRender);

    // Đợi một chút để đảm bảo React đã render xong component
    await new Promise((resolve) => setTimeout(resolve, 500));

    const elementToCapture = pdfContainer.firstElementChild as HTMLElement;
    if (!elementToCapture) {
      notification.error({
        message: "Could not find element to generate PDF.",
      });
      setIsDownloading(false);
      document.body.removeChild(pdfContainer);
      return;
    }

    try {
      // 1. Dùng html2canvas để "chụp ảnh" component thành canvas
      const canvas = await html2canvas(elementToCapture, {
        scale: 2, // Tăng chất lượng ảnh
        useCORS: true, // Cho phép tải ảnh từ domain khác (quan trọng cho avatar)
      });

      // Lấy dữ liệu ảnh từ canvas
      const imgData = canvas.toDataURL("image/jpeg", 0.98); // Chất lượng 98%

      // 2. Dùng jsPDF để tạo file PDF
      const pdf = new jsPDF({
        orientation: "portrait", // Hướng dọc
        unit: "mm", // Đơn vị mm
        format: "a4", // Khổ giấy A4
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Tính toán tỉ lệ của ảnh để vừa với trang A4
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasWidth / canvasHeight;

      let imgWidth = pdfWidth;
      let imgHeight = imgWidth / ratio;

      // Nếu chiều cao vượt quá trang, thì tính lại dựa trên chiều cao
      if (imgHeight > pdfHeight) {
        imgHeight = pdfHeight;
        imgWidth = imgHeight * ratio;
      }

      // 3. Thêm ảnh vào PDF và lưu file
      pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);
      const filename = `${userData.onlineResume?.fullName || userData.name}_${templateName}_CV.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error("Could not generate PDF", err);
      notification.error({
        message: "Failed to generate PDF. Please check the console.",
      });
    } finally {
      // 4. Dọn dẹp container ẩn sau khi hoàn tất
      document.body.removeChild(pdfContainer);
      setIsDownloading(false);
    }
  };

  // === RENDER LOGIC ===
  if (isLoading) {
    return <Spin spinning={true} fullscreen />;
  }

  if (error || !userData?.onlineResume) {
    return (
      <Container className="public-cv-container my-5">
        <Result
          status="404"
          title="Profile Not Found"
          subTitle={
            error ||
            "Sorry, the profile you are looking for does not exist or has not been created yet."
          }
          extra={
            <Button variant="primary" href="/">
              Back Home
            </Button>
          }
        />
      </Container>
    );
  }

  const { onlineResume, workExperiences } = userData;

  return (
    <>
      <div
        style={{
          backgroundImage: `url(${hero})`,
          width: "100%",
          height: 500,
          position: "absolute",
          top: 50,
          backgroundRepeat: "repeat",
          zIndex: 0,
        }}
      ></div>
      <div className="public-cv-wrapper">
        {/* Main CV Display */}
        <Container className="public-cv-container my-5">
          {/* ...Phần JSX còn lại giữ nguyên... */}
          <Row>
            {/* Cột trái - Sidebar */}
            <Col md={4} className="sidebar-col">
              <Card className="sidebar-card">
                <Card.Body className="text-center">
                  <Image
                    src={getAvatarUrl(userData.avatar)}
                    roundedCircle
                    className="profile-avatar mb-3"
                  />
                  <h2 className="user-name">{userData.name}</h2>
                  <p className="resume-title-sidebar">{onlineResume?.title}</p>

                  <div className="d-grid gap-2 my-4">
                    {userData.mainResume && (
                      <a
                        href={`${import.meta.env.VITE_BACKEND_URL}/api/v1/files?fileName=${userData.mainResume}&folder=resumes`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="primary" className="w-100">
                          <DownloadOutlined /> Download Full CV
                        </Button>
                      </a>
                    )}
                    <Button
                      variant="outline-primary"
                      className="w-100"
                      onClick={() => setShowTemplateModal(true)}
                      disabled={isDownloading}
                    >
                      <FilePdfOutlined />{" "}
                      {isDownloading
                        ? "Generating..."
                        : "Export Online CV to PDF"}
                    </Button>
                  </div>

                  <hr />

                  <div className="contact-info text-start">
                    <h5 className="sidebar-heading">Contact</h5>
                    {userData.email && (
                      <p>
                        <MailOutlined /> &nbsp; {userData.email}
                      </p>
                    )}
                    {!userData.email && (
                      <p>
                        <MailOutlined /> &nbsp; Private
                      </p>
                    )}

                    {onlineResume?.phone && (
                      <p>
                        <PhoneOutlined /> &nbsp; {onlineResume.phone}
                      </p>
                    )}
                    {!onlineResume?.phone && (
                      <p>
                        <PhoneOutlined /> &nbsp; Private
                      </p>
                    )}
                    {userData.address && (
                      <p>
                        <HomeOutlined /> &nbsp; {userData.address}
                      </p>
                    )}
                    {!userData.address && (
                      <p>
                        <HomeOutlined /> &nbsp; Private
                      </p>
                    )}
                  </div>
                  <hr />
                  <div className="skills-info text-start">
                    <h5 className="sidebar-heading">Skills</h5>
                    <div>
                      {onlineResume?.skills?.map((skill) => (
                        <Tag color="blue" key={skill.id} className="skill-tag">
                          {skill.name}
                        </Tag>
                      ))}
                    </div>
                  </div>
                  <hr />
                  <div className="skills-info text-start">
                    <h5 className="sidebar-heading">Languages</h5>
                    <div className="language-text">
                      {onlineResume?.languages?.split("\n").map((lang, i) => (
                        <p key={i} className="mb-1">
                          {lang}
                        </p>
                      ))}
                    </div>
                  </div>
                </Card.Body>
                <Button
                  onClick={() =>
                    navigate("/chat/detail", {
                      state: { receiver: userData ?? {} },
                    })
                  }
                  color="light"
                  className="mt-3 w-100"
                >
                  Nhắn tin
                </Button>
              </Card>
            </Col>

            {/* Cột phải - Nội dung chính */}
            <Col md={8} className="main-content-col">
              <Card className="content-card mb-4">
                <Card.Body>
                  <Card.Title as="h4" className="card-title-icon">
                    Summary
                  </Card.Title>
                  <Card.Text as="div" className="summary-text">
                    {onlineResume?.summary}
                  </Card.Text>
                </Card.Body>
              </Card>

              {workExperiences && workExperiences.length > 0 && (
                <Card className="content-card mb-4">
                  <Card.Body>
                    <Card.Title as="h4" className="card-title-icon">
                      Work Experience
                    </Card.Title>
                    <div className="timeline">
                      {workExperiences.map((exp) => (
                        <div className="timeline-item" key={exp.id}>
                          <div className="timeline-dot"></div>
                          <div className="timeline-content">
                            <h5 className="experience-company">
                              {exp.companyName}
                            </h5>
                            <p className="experience-duration text-muted">
                              {moment(exp.startDate).format("MMM YYYY")} -{" "}
                              {exp.endDate
                                ? moment(exp.endDate).format("MMM YYYY")
                                : "Present"}{" "}
                              | {exp.location}
                            </p>
                            <div className="experience-description">
                              {exp.description.split("\n").map((line, i) => (
                                <p key={i} className="mb-1">
                                  {line}
                                </p>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              )}
              <Row>
                <Col md={6}>
                  <Card className="content-card mb-4">
                    <Card.Body>
                      <Card.Title as="h4" className="card-title-icon">
                        Education
                      </Card.Title>
                      <div className="simple-text">
                        {onlineResume?.educations?.split("\n").map((edu, i) => (
                          <p key={i} className="mb-1">
                            {edu}
                          </p>
                        ))}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="content-card mb-4">
                    <Card.Body>
                      <Card.Title as="h4" className="card-title-icon">
                        Certifications
                      </Card.Title>
                      <div className="simple-text">
                        {onlineResume?.certifications
                          ?.split("\n")
                          .map((cert, i) => (
                            <p key={i} className="mb-1">
                              {cert}
                            </p>
                          ))}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Col>
          </Row>
        </Container>

        {/* Modal for Template Selection */}
        <Modal
          show={showTemplateModal}
          onHide={() => setShowTemplateModal(false)}
          size="lg"
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Choose a CV Template</Modal.Title>
          </Modal.Header>
          <Modal.Body
            style={{ maxHeight: "calc(100vh - 210px)", overflowY: "auto" }}
          >
            <Container>
              <Row>
                {templates.map((template) => (
                  <Col md={6} key={template.name} className="mb-3">
                    <Card className="text-center">
                      <Card.Img
                        variant="top"
                        src={template.preview}
                        style={{
                          height: "400px",
                          objectFit: "contain",
                          background: "#f8f9fa",
                          padding: "10px",
                          borderBottom: "1px solid #dee2e6",
                        }}
                      />
                      <Card.Body>
                        <Card.Title>{template.name}</Card.Title>
                        <Button
                          variant="primary"
                          onClick={() => handleDownloadPdf(template.name)}
                        >
                          Choose {template.name}
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Container>
          </Modal.Body>
        </Modal>
      </div>
    </>
  );
};

export default PublicCvPage;
