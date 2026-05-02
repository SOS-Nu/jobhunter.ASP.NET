import { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Alert,
  Spinner,
} from "react-bootstrap";
import {
  UploadOutlined,
  RobotOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import {
  message,
  Tag,
  List,
  Typography,
  Descriptions,
  Divider,
  Spin,
  theme,
  ConfigProvider,
} from "antd";
// Đảm bảo bạn đã cài đặt và cấu hình react-i18next
import { useTranslation } from "react-i18next";
import { useAppSelector } from "@/redux/hooks";
import { callEvaluateCVWithAI, callFetchUserDetailById } from "@/config/api";
import { IEvaluationResult, IUser } from "@/types/backend";
import "./CVAIEvaluation.scss";
import { useCurrentApp } from "@/components/context/app.context";
import { useNavigate } from "react-router-dom";
import bg from "assets/top-bg.svg";

const CVAIEvaluationPage = () => {
  const { t, i18n } = useTranslation();

  const isAuthenticated = useAppSelector(
    (state) => state.account.isAuthenticated
  );
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.account.user);
  const [evaluationType, setEvaluationType] = useState<"online" | "upload">(
    "online"
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<IEvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fullUserData, setFullUserData] = useState<IUser | null>(null);
  const [isFetchingProfile, setIsFetchingProfile] = useState<boolean>(true);
  const { theme: currentTheme } = useCurrentApp();

  const hasOnlineResume =
    fullUserData?.onlineResume && fullUserData.onlineResume.id;

  useEffect(() => {
    if (isAuthenticated) {
      const fetchUserDetail = async () => {
        if (user?.id) {
          setIsFetchingProfile(true);
          try {
            const res = await callFetchUserDetailById(user.id);
            if (res && res.data) {
              setFullUserData(res.data);
              if (!res.data.onlineResume) {
                setEvaluationType("upload");
              }
            }
          } catch (e) {
            // Vẫn dùng 't' ở đây bình thường
            message.error(t("cv.message.couldNotFetchProfile"));
          } finally {
            setIsFetchingProfile(false);
          }
        } else {
          setIsFetchingProfile(false);
          setEvaluationType("upload");
        }
      };

      fetchUserDetail();
    } else {
      setIsFetchingProfile(false);
    }

    // Chúng ta cố tình loại bỏ 't' và 'i18n' khỏi mảng dependency
    // vì không muốn fetch lại dữ liệu khi đổi ngôn ngữ.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id, isAuthenticated]); // <-- ĐÃ XÓA 't'

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleEvaluate = async () => {
    // Đã chỉnh sửa: t("cv.error.selectCVFile")
    if (evaluationType === "upload" && !selectedFile) {
      setError(t("cv.error.selectCVFile"));
      return;
    }

    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const formData = new FormData();
      if (evaluationType === "upload" && selectedFile) {
        formData.append("cvFile", selectedFile);
      }

      const language = i18n.language || "vi";
      formData.append("language", language);

      const res = await callEvaluateCVWithAI(formData);

      if (res && res.data) {
        setResult(res.data);
        // Đã chỉnh sửa: t("cv.message.aiEvaluationCompleted")
        message.success(t("cv.message.aiEvaluationCompleted"));
      } else {
        // Đã chỉnh sửa: t("cv.error.unknownError")
        setError(res.message ?? t("cv.error.unknownError"));
      }
    } catch (e: any) {
      // Đã chỉnh sửa: t("cv.error.failedToGetEvaluation") và t("cv.message.errorDuringEvaluation")
      setError(e.message || t("cv.error.failedToGetEvaluation"));
      message.error(t("cv.message.errorDuringEvaluation"));
    } finally {
      setIsLoading(false);
    }
  };

  const renderResults = () => {
    if (!result) return null;

    const antdThemeAlgorithm =
      currentTheme === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm;

    return (
      <ConfigProvider
        theme={{
          algorithm: antdThemeAlgorithm,
          token: {
            fontSize: 16,
            colorSplit:
              currentTheme === "dark"
                ? "rgba(255, 255, 255, 0.15)"
                : "rgba(5, 5, 5, 0.06)",
          },
        }}
      >
        <Card className="result-card mt-5">
          <Card.Header as="h4">
            <RobotOutlined /> {t("cv.result.aiEvaluationResult")}
          </Card.Header>

          <Card.Body>
            <Descriptions bordered column={1}>
              <Descriptions.Item label={t("cv.result.overallScore")}>
                <Tag color={result.overallScore > 75 ? "green" : "orange"}>
                  {result.overallScore} / 100
                </Tag>
              </Descriptions.Item>

              <Descriptions.Item label={t("cv.result.summary")}>
                {result.summary}
              </Descriptions.Item>

              <Descriptions.Item label={t("cv.result.estimatedSalary")}>
                {result.estimatedSalaryRange}
              </Descriptions.Item>
            </Descriptions>

            <Divider>{t("cv.result.strengths")}</Divider>
            <List
              bordered
              dataSource={result.strengths}
              renderItem={(item) => <List.Item>{item}</List.Item>}
            />

            <Divider>{t("cv.result.improvements")}</Divider>
            <List
              bordered
              dataSource={result.improvements}
              renderItem={(item) => (
                <List.Item>
                  <strong>{item.area}:</strong> {item.suggestion}
                </List.Item>
              )}
            />

            <Divider>{t("cv.result.suggestedRoadmap")}</Divider>
            <List
              bordered
              dataSource={result.suggestedRoadmap}
              renderItem={(item) => (
                <List.Item>
                  <Typography.Text>
                    <strong>
                      {t("cv.result.step", { step: item.step })}: {item.action}
                    </strong>{" "}
                    - {item.reason}
                  </Typography.Text>
                </List.Item>
              )}
            />

            <Divider>{t("cv.result.relevantJobs")}</Divider>
            <List
              bordered
              dataSource={result.relevantJobs}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <a
                      href={`/job/detail/${item.jobId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t("cv.action.view")}
                    </a>,
                  ]}
                >
                  <List.Item.Meta
                    title={t("cv.result.jobTitleAtCompany", {
                      title: item.jobTitle,
                      company: item.companyName,
                    })}
                    description={item.matchReason}
                  />
                </List.Item>
              )}
            />
          </Card.Body>
        </Card>
      </ConfigProvider>
    );
  };

  // Hiển thị khi chưa đăng nhập
  if (!isAuthenticated) {
    return (
      <Container className="my-5" style={{ minHeight: "60vh" }}>
        <Row className="justify-content-center align-items-center h-100">
          <Col md={8}>
            <Alert variant="danger" className="text-center p-4">
              <Alert.Heading>
                <RobotOutlined style={{ marginRight: "8px" }} />
                {t("cv.auth.loginRequiredTitle")}
              </Alert.Heading>
              <p className="mb-3">{t("cv.auth.loginRequiredMessage")}</p>
              <Button onClick={() => navigate("/login")} variant="primary">
                {t("cv.auth.goToLoginPage")}
              </Button>
            </Alert>
          </Col>
        </Row>
      </Container>
    );
  }

  if (isFetchingProfile) {
    return (
      <Spin spinning={true} fullscreen tip={t("cv.loading.loadingProfile")} />
    );
  }

  // Giao diện chính sau khi đăng nhập
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
      <Container className="cv-evaluation-container my-5">
        <Row className="justify-content-center">
          <Col md={10}>
            <Card className="evaluation-card">
              <Card.Body>
                <div className="text-center mb-4">
                  <h1 className="evaluation-title">
                    {t("cv.title.aiCvAnalysis")}
                  </h1>
                  <p className="evaluation-subtitle">
                    {t("cv.subtitle.getInstantFeedback")}
                  </p>
                </div>

                <Form.Group className="mb-3">
                  <Form.Label>{t("cv.form.chooseCvSource")}</Form.Label>
                  <div className="d-flex gap-3">
                    <Button
                      variant={
                        evaluationType === "online"
                          ? "primary"
                          : "outline-secondary"
                      }
                      onClick={() => setEvaluationType("online")}
                      disabled={!hasOnlineResume}
                    >
                      {t("cv.form.useOnlineProfile")}
                    </Button>
                    <Button
                      variant={
                        evaluationType === "upload"
                          ? "primary"
                          : "outline-secondary"
                      }
                      onClick={() => setEvaluationType("upload")}
                    >
                      {t("cv.form.uploadNewCv")}
                    </Button>
                  </div>
                  {!hasOnlineResume && (
                    <Alert variant="info" className="mt-2">
                      {t("cv.alert.noOnlineProfilePart1")}{" "}
                      <a href="/resume/create">{t("cv.alert.createOne")}</a>{" "}
                      {t("cv.alert.noOnlineProfilePart2")}
                    </Alert>
                  )}
                </Form.Group>

                {evaluationType === "online" && (
                  <div className="online-profile-display">
                    {t("cv.form.usingOnlineProfile")}:{" "}
                    <strong>
                      {fullUserData?.mainResume || t("cv.form.defaultProfile")}
                    </strong>
                  </div>
                )}

                {evaluationType === "upload" && (
                  <Form.Group controlId="formFile" className="mb-3">
                    <Form.Label>{t("cv.form.uploadCvLabel")}</Form.Label>
                    <Form.Control
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx"
                    />
                  </Form.Group>
                )}

                {error && <Alert variant="danger">{error}</Alert>}

                <div className="d-grid mt-4">
                  <Button
                    variant="success"
                    size="lg"
                    onClick={handleEvaluate}
                    disabled={
                      isLoading ||
                      (evaluationType === "upload" && !selectedFile)
                    }
                  >
                    {isLoading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                        />{" "}
                        {t("cv.action.analyzing")}
                      </>
                    ) : (
                      <>
                        <ThunderboltOutlined />{" "}
                        {t("cv.action.startAiEvaluation")}
                      </>
                    )}
                  </Button>
                </div>
              </Card.Body>
            </Card>

            {renderResults()}
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default CVAIEvaluationPage;
