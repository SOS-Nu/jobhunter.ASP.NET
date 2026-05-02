// src/pages/resume/create-online.tsx

import { useState, useEffect } from "react";
import { Container, Row, Col, Form, Button, Card } from "react-bootstrap";
import {
  callCreateOnlineResume,
  callUpdateOnlineResume,
  callCreateWorkExperience,
  callUpdateWorkExperience,
  callDeleteWorkExperience,
  callFetchAllSkill,
  callFetchUserDetailById,
  // Thêm import mới
  callUploadMainResume,
} from "@/config/api";
import { IOnlineResume, IWorkExperience, ISkill } from "@/types/backend";
import { message, notification, Select, Space, Spin } from "antd";
import { useAppSelector } from "@/redux/hooks";
// Thêm import mới
import {
  PlusOutlined,
  DeleteOutlined,
  DownloadOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import "@/styles/stylespotfolio/create-online-resume.scss";
import bg from "assets/top-bg.svg";

const CreateOnlineResumePage = () => {
  const user = useAppSelector((state) => state.account.user);

  const defaultEmptyExperience = {
    companyName: "",
    startDate: "",
    endDate: "",
    description: "",
    location: "",
  };
  const defaultEmptyResume = {
    title: "",
    fullName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    address: "",
    summary: "",
    certifications: "",
    educations: "",
    languages: "",
    skills: [],
  };

  const [resumeData, setResumeData] =
    useState<Partial<IOnlineResume>>(defaultEmptyResume);
  const [workExperiences, setWorkExperiences] = useState<
    Partial<IWorkExperience>[]
  >([defaultEmptyExperience]);

  // State mới cho CV chính
  const [mainResumeName, setMainResumeName] = useState<
    string | null | undefined
  >(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [allSkills, setAllSkills] = useState<ISkill[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingPage, setIsLoadingPage] = useState(true);

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const res = await callFetchAllSkill("current=1&pageSize=100");
        if (res?.data) setAllSkills(res.data.result);
      } catch (error) {
        console.error("Failed to fetch skills:", error);
      }
    };
    fetchSkills();
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) {
        setResumeData(defaultEmptyResume);
        setWorkExperiences([defaultEmptyExperience]);
        setMainResumeName(null); // Reset CV chính
        setIsLoadingPage(false);
        return;
      }

      setIsLoadingPage(true);
      try {
        const res = await callFetchUserDetailById(user.id);
        if (res && res.data) {
          const userData = res.data;
          // Cập nhật state cho CV chính
          setMainResumeName(userData.mainResume);

          if (userData.onlineResume) {
            const { dateOfBirth, ...rest } = userData.onlineResume;
            setResumeData({
              ...rest,
              dateOfBirth: dateOfBirth ? dateOfBirth.split("T")[0] : "",
            });
          } else {
            setResumeData(defaultEmptyResume);
          }
          if (userData.workExperiences && userData.workExperiences.length > 0) {
            setWorkExperiences(userData.workExperiences);
          } else {
            setWorkExperiences([defaultEmptyExperience]);
          }
        } else {
          setResumeData(defaultEmptyResume);
          setWorkExperiences([defaultEmptyExperience]);
          setMainResumeName(null);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        notification.error({ message: "Failed to fetch your resume data" });
      } finally {
        setIsLoadingPage(false);
      }
    };

    fetchUserData();
  }, [user]);

  // Handler cho các logic form
  const handleResumeChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setResumeData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleSkillChange = (value: number[]) => {
    setResumeData((prev) => ({ ...prev, skills: value.map((id) => ({ id })) }));
  };
  const handleWorkExperienceChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const newWorkExperiences = [...workExperiences];
    newWorkExperiences[index] = {
      ...newWorkExperiences[index],
      [e.target.name]: e.target.value,
    };
    setWorkExperiences(newWorkExperiences);
  };
  const addWorkExperience = () => {
    setWorkExperiences([...workExperiences, defaultEmptyExperience]);
  };
  const removeWorkExperience = (index: number, id?: number) => {
    if (workExperiences.length === 1) {
      notification.info({
        message: "You must have at least one work experience form.",
      });
      return;
    }
    if (id) handleDeleteWorkExperience(id, index);
    else {
      const newWorkExperiences = [...workExperiences];
      newWorkExperiences.splice(index, 1);
      setWorkExperiences(newWorkExperiences);
    }
  };
  const handleSaveWorkExperience = async (index: number) => {
    const experience = workExperiences[index] as IWorkExperience;
    if (!experience.companyName || !experience.startDate) {
      notification.error({
        message: "Company Name and Start Date are required.",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = experience.id
        ? await callUpdateWorkExperience(experience)
        : await callCreateWorkExperience(experience);
      if (res?.data) {
        message.success(`Experience ${experience.id ? "updated" : "saved"}!`);
        const newWorkExperiences = [...workExperiences];
        newWorkExperiences[index] = res.data;
        setWorkExperiences(newWorkExperiences);
      }
    } catch (error) {
      notification.error({ message: "Error saving experience" });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleDeleteWorkExperience = async (id: number, index: number) => {
    setIsSubmitting(true);
    try {
      await callDeleteWorkExperience(id);
      message.success("Work experience deleted!");
      const newWorkExperiences = [...workExperiences];
      newWorkExperiences.splice(index, 1);
      setWorkExperiences(newWorkExperiences);
    } catch (error) {
      notification.error({ message: "Error deleting experience" });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleSubmitResume = async () => {
    if (!resumeData.title || !resumeData.fullName) {
      notification.error({
        message: "Resume Title and Full Name are required.",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const finalData = { ...resumeData } as IOnlineResume;
      const res = resumeData.id
        ? await callUpdateOnlineResume(finalData)
        : await callCreateOnlineResume(finalData);
      if (res?.data) {
        message.success(
          `Personal Information ${resumeData.id ? "updated" : "saved"}!`
        );
        const { dateOfBirth, ...rest } = res.data;
        setResumeData({
          ...rest,
          dateOfBirth: dateOfBirth ? dateOfBirth.split("T")[0] : "",
        });
      }
    } catch (error) {
      notification.error({ message: "Error saving personal information" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Các handler mới cho việc upload CV chính
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadMainResume = async () => {
    if (!selectedFile) {
      notification.error({ message: "Please select a file to upload." });
      return;
    }

    setIsUploading(true);
    try {
      const res = await callUploadMainResume(selectedFile);
      if (res.data) {
        message.success("Main CV uploaded successfully!");
        setMainResumeName(res.data.fileName); // Cập nhật state với tên file mới
        setSelectedFile(null); // Reset file đã chọn
      }
    } catch (error) {
      notification.error({ message: "Error uploading file." });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <div
        style={{
          backgroundImage: `url(${bg})`,
          width: "100%",
          height: 500,
          position: "absolute",
          top: 50,
          backgroundRepeat: "repeat",
          zIndex: 0,
        }}
      ></div>
      <div key={user?.id || "logged-out"}>
        <Spin spinning={isLoadingPage} fullscreen />
        {!isLoadingPage && (
          <Container className="create-resume-container my-5">
            <Row>
              <Col>
                <h1 className="resume-title">
                  {resumeData.id ? "Edit Your" : "Create Your"} Profile
                </h1>
                <p className="resume-subtitle">
                  Manage your online resume and main CV file.
                </p>
              </Col>
            </Row>

            {/* ====== SECTION MỚI CHO MAIN CV ====== */}
            <Row>
              <Col md={12} className="mb-4">
                <Card className="resume-card">
                  <Card.Header as="h5">Main CV File</Card.Header>
                  <Card.Body>
                    {mainResumeName ? (
                      <div className="d-flex justify-content-between align-items-center">
                        <span>
                          Your current main CV:{" "}
                          <strong>{mainResumeName}</strong>
                        </span>
                        <a
                          href={`${import.meta.env.VITE_BACKEND_URL}/api/v1/files?fileName=${mainResumeName}&folder=resumes`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="primary">
                            <DownloadOutlined />
                            Download
                          </Button>
                        </a>
                      </div>
                    ) : (
                      <div>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            Upload your main CV (PDF, DOC, DOCX)
                          </Form.Label>
                          <Form.Control
                            type="file"
                            onChange={handleFileChange}
                            accept=".pdf,.doc,.docx"
                          />
                        </Form.Group>
                        <Button
                          variant="primary"
                          onClick={handleUploadMainResume}
                          disabled={!selectedFile || isUploading}
                        >
                          <DownloadOutlined />
                          {isUploading ? "Uploading..." : "Upload"}
                        </Button>
                        {selectedFile && (
                          <div className="mt-2">
                            Selected file: {selectedFile.name}
                          </div>
                        )}
                      </div>
                    )}
                    {mainResumeName && (
                      <div className="mt-3">
                        <hr />
                        <Form.Group>
                          <Form.Label>Or replace it with a new one:</Form.Label>
                          <Form.Control
                            type="file"
                            onChange={handleFileChange}
                            accept=".pdf,.doc,.docx"
                          />
                        </Form.Group>
                        <Button
                          className="mt-2"
                          variant="primary"
                          onClick={handleUploadMainResume}
                          disabled={!selectedFile || isUploading}
                        >
                          <DownloadOutlined />
                          {isUploading ? "Uploading..." : "Upload New Version"}
                        </Button>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            {/* ====== KẾT THÚC SECTION MAIN CV ====== */}

            <Row>
              <Col md={12} className="mb-4">
                <Card className="resume-card">
                  <Card.Header as="h5">
                    Online Resume - Personal Information
                  </Card.Header>
                  <Card.Body>
                    <Form>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Resume Title</Form.Label>
                            <Form.Control
                              type="text"
                              placeholder="e.g., Senior Java Developer"
                              name="title"
                              value={resumeData.title || ""}
                              onChange={handleResumeChange}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Full Name</Form.Label>
                            <Form.Control
                              type="text"
                              name="fullName"
                              value={resumeData.fullName || ""}
                              onChange={handleResumeChange}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Email</Form.Label>
                            <Form.Control
                              type="email"
                              name="email"
                              value={resumeData.email || ""}
                              onChange={handleResumeChange}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Phone</Form.Label>
                            <Form.Control
                              type="text"
                              name="phone"
                              value={resumeData.phone || ""}
                              onChange={handleResumeChange}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Date of Birth</Form.Label>
                            <Form.Control
                              type="date"
                              name="dateOfBirth"
                              value={resumeData.dateOfBirth || ""}
                              onChange={handleResumeChange}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Address</Form.Label>
                            <Form.Control
                              type="text"
                              name="address"
                              value={resumeData.address || ""}
                              onChange={handleResumeChange}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={12}>
                          <Form.Group className="mb-3">
                            <Form.Label>Summary</Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={4}
                              name="summary"
                              placeholder="Briefly describe your professional background..."
                              value={resumeData.summary || ""}
                              onChange={handleResumeChange}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={12}>
                          <Form.Group className="mb-3">
                            <Form.Label>Skills</Form.Label>
                            <Select
                              mode="multiple"
                              allowClear
                              style={{ width: "100%" }}
                              placeholder="Select skills"
                              onChange={handleSkillChange}
                              value={resumeData.skills?.map((s) => s.id) || []}
                              options={allSkills.map((skill) => ({
                                label: skill.name,
                                value: skill.id,
                              }))}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Certifications</Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={3}
                              name="certifications"
                              placeholder="e.g., AWS Certified"
                              value={resumeData.certifications || ""}
                              onChange={handleResumeChange}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Educations</Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={3}
                              name="educations"
                              placeholder="e.g., BSc in Computer Science"
                              value={resumeData.educations || ""}
                              onChange={handleResumeChange}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={12}>
                          <Form.Group className="mb-3">
                            <Form.Label>Languages</Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={3}
                              name="languages"
                              placeholder="e.g., English (Fluent)"
                              value={resumeData.languages || ""}
                              onChange={handleResumeChange}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    </Form>
                    <hr />
                    <div className="d-flex justify-content-end">
                      <Button
                        variant="primary"
                        onClick={handleSubmitResume}
                        disabled={isSubmitting}
                      >
                        {isSubmitting
                          ? "Saving..."
                          : resumeData.id
                            ? "Update Information"
                            : "Save Information"}
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={12}>
                <Card className="resume-card">
                  <Card.Header as="h5">
                    Online Resume - Work Experience
                  </Card.Header>
                  <Card.Body>
                    {workExperiences.map((exp, index) => (
                      <Card key={index} className="mb-3 experience-item">
                        <Card.Body>
                          <Form>
                            <Row>
                              <Col md={6}>
                                <Form.Group className="mb-3">
                                  <Form.Label>Company Name</Form.Label>
                                  <Form.Control
                                    type="text"
                                    name="companyName"
                                    value={exp.companyName || ""}
                                    onChange={(e) =>
                                      handleWorkExperienceChange(index, e)
                                    }
                                  />
                                </Form.Group>
                              </Col>
                              <Col md={6}>
                                <Form.Group className="mb-3">
                                  <Form.Label>Location</Form.Label>
                                  <Form.Control
                                    type="text"
                                    name="location"
                                    value={exp.location || ""}
                                    onChange={(e) =>
                                      handleWorkExperienceChange(index, e)
                                    }
                                  />
                                </Form.Group>
                              </Col>
                              <Col md={6}>
                                <Form.Group className="mb-3">
                                  <Form.Label>Start Date</Form.Label>
                                  <Form.Control
                                    type="date"
                                    name="startDate"
                                    value={exp.startDate?.split("T")[0] || ""}
                                    onChange={(e) =>
                                      handleWorkExperienceChange(index, e)
                                    }
                                  />
                                </Form.Group>
                              </Col>
                              <Col md={6}>
                                <Form.Group className="mb-3">
                                  <Form.Label>End Date</Form.Label>
                                  <Form.Control
                                    type="date"
                                    name="endDate"
                                    value={exp.endDate?.split("T")[0] || ""}
                                    onChange={(e) =>
                                      handleWorkExperienceChange(index, e)
                                    }
                                  />
                                </Form.Group>
                              </Col>
                              <Col md={12}>
                                <Form.Group className="mb-3">
                                  <Form.Label>Description</Form.Label>
                                  <Form.Control
                                    as="textarea"
                                    rows={5}
                                    name="description"
                                    value={exp.description || ""}
                                    onChange={(e) =>
                                      handleWorkExperienceChange(index, e)
                                    }
                                  />
                                </Form.Group>
                              </Col>
                            </Row>
                            <Space>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleSaveWorkExperience(index)}
                                disabled={isSubmitting}
                              >
                                {isSubmitting
                                  ? "Saving..."
                                  : exp.id
                                    ? "Update"
                                    : "Save"}
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() =>
                                  removeWorkExperience(index, exp.id)
                                }
                                disabled={isSubmitting}
                              >
                                <DeleteOutlined /> Remove
                              </Button>
                            </Space>
                          </Form>
                        </Card.Body>
                      </Card>
                    ))}
                    <Button
                      variant="outline-primary"
                      className="mt-2"
                      onClick={addWorkExperience}
                      disabled={isSubmitting}
                    >
                      <PlusOutlined /> Add Another Experience
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Container>
        )}
      </div>
    </>
  );
};

export default CreateOnlineResumePage;
