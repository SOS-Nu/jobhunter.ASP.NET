import { callEvaluateInterview, callGenerateQuestions } from "@/config/api";
import "@/styles/interview-modal.scss";
import {
  IEvaluateInterviewRequest,
  IInterviewFeedbackResponse,
  IInterviewQuestion,
} from "@/types/backend";
import {
  BulbOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LeftOutlined,
  ReloadOutlined,
  RightOutlined,
  RobotOutlined,
  SendOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { Progress, message } from "antd";
import { useMemo, useState } from "react";
import { Badge, Button, Form, Modal, Spinner } from "react-bootstrap";

interface IProps {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  jobId: string | undefined;
  jobName: string | undefined;
}

const InterviewModal = (props: IProps) => {
  const { isOpen, setIsOpen, jobId, jobName } = props;

  // --- State Management ---
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [questions, setQuestions] = useState<IInterviewQuestion[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<IInterviewFeedbackResponse | null>(
    null,
  );

  const language = localStorage.getItem("language") || "vi";

  // --- Calculations ---
  const progressPercent = useMemo(() => {
    if (questions.length === 0) return 0;
    return Math.round(((currentIndex + 1) / questions.length) * 100);
  }, [currentIndex, questions.length]);

  // --- Business Logic ---
  const handleStartInterview = async () => {
    if (!jobId) return;
    setIsLoading(true);
    try {
      const res = await callGenerateQuestions(jobId, 10, language);
      if (res && res.data) {
        setQuestions(res.data.questions);
        setAnswers(new Array(res.data.questions.length).fill(""));
        setCurrentIndex(0);
        setStep(2);
      }
    } catch (error) {
      message.error(
        language === "vi" ? "Lỗi kết nối AI" : "AI Connection Error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const updateAnswer = (value: string) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = value;
    setAnswers(newAnswers);
  };

  const handleSubmitAnswers = async () => {
    setIsLoading(true);
    try {
      const payload: IEvaluateInterviewRequest = {
        jobId,
        answers: questions.map((q, index) => ({
          question: q.question,
          answer:
            answers[index]?.trim() ||
            (language === "vi" ? "Không trả lời" : "No answer"),
        })),
      };
      const res = await callEvaluateInterview(payload, language);
      if (res && res.data) {
        setFeedback(res.data);
        setStep(3);
      }
    } catch (error) {
      message.error(language === "vi" ? "Lỗi chấm điểm" : "Evaluation Error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setCurrentIndex(0);
    setQuestions([]);
    setAnswers([]);
    setFeedback(null);
  };

  return (
    <Modal
      show={isOpen}
      onHide={() => !isLoading && setIsOpen(false)}
      size="lg"
      centered
      className="interview-modal-custom"
      backdrop="static"
      keyboard={false}
    >
      <Modal.Header closeButton={!isLoading}>
        <Modal.Title className="d-flex align-items-center">
          <RobotOutlined className="me-2 text-primary" />
          <span>
            {language === "vi" ? "Phỏng vấn giả lập AI" : "AI Mock Interview"}
          </span>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="interview-modal-body">
        {/* --- STEP 1: WELCOME --- */}
        {step === 1 && (
          <div className="step-container welcome-step text-center py-5">
            <div className="icon-wrapper mb-4">
              <RobotOutlined
                style={{ fontSize: "70px", color: "var(--brand-social)" }}
              />
            </div>
            <h3 className="fw-bold mb-3">Sẵn sàng cho thử thách?</h3>
            <p
              className="text-muted-custom mb-4 mx-auto"
              style={{ maxWidth: "500px" }}
            >
              Hệ thống sẽ tạo <strong>{questions.length || 10} câu hỏi</strong>{" "}
              chuyên môn cho vị trí
              <span className="text-primary ms-1">{jobName}</span>.
            </p>
            <Button
              className="view-vip btn-lg px-5 py-3 shadow"
              onClick={handleStartInterview}
              disabled={isLoading}
            >
              {isLoading ? <Spinner size="sm" className="me-2" /> : null}
              {language === "vi" ? "Bắt đầu phỏng vấn" : "Start Interview"}
            </Button>
          </div>
        )}

        {/* --- STEP 2: QUESTIONS FLOW --- */}
        {step === 2 && questions.length > 0 && (
          <div className="step-container question-step px-md-3">
            <div className="interview-progress mb-4">
              <div className="d-flex justify-content-between align-items-end mb-2">
                <span className="small fw-bold text-muted">
                  CÂU HỎI {currentIndex + 1} / {questions.length}
                </span>
                <span className="small text-primary">{progressPercent}%</span>
              </div>
              <Progress
                percent={progressPercent}
                showInfo={false}
                strokeColor="var(--brand-social)"
                trailColor="rgba(255,255,255,0.1)"
              />
            </div>

            <div
              className="question-content-box mb-4 animate-fade-in"
              key={currentIndex}
            >
              <div className="q-label mb-3">
                <Badge bg="primary" className="p-2 px-3 mb-2">
                  Câu hỏi hiện tại
                </Badge>
                <h4 className="fw-bold score-text line-height-base">
                  {questions[currentIndex].question}
                </h4>
              </div>

              <Form.Group>
                <Form.Control
                  as="textarea"
                  rows={8}
                  className="answer-textarea"
                  placeholder={
                    language === "vi"
                      ? "Nhập câu trả lời của bạn..."
                      : "Type your answer here..."
                  }
                  value={answers[currentIndex]}
                  onChange={(e) => updateAnswer(e.target.value)}
                  autoFocus
                />
              </Form.Group>

              <div className="hint-alert mt-3">
                <BulbOutlined className="text-warning me-2" />
                <span className="fst-italic small">
                  <strong>Gợi ý:</strong> {questions[currentIndex].hint}
                </span>
              </div>
            </div>

            <div className="navigation-footer d-flex justify-content-between border-top pt-4">
              <Button
                onClick={handlePrev}
                disabled={currentIndex === 0 || isLoading}
                className="btn-nav"
              >
                <LeftOutlined className="me-1" /> Trước đó
              </Button>

              {currentIndex === questions.length - 1 ? (
                <Button
                  variant="primary"
                  className="btn-submit view-vip border-0"
                  onClick={handleSubmitAnswers}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Spinner size="sm" className="me-2" />
                  ) : (
                    <SendOutlined className="me-1" />
                  )}
                  Hoàn tất & Nộp bài
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleNext}
                  disabled={isLoading}
                  className="btn-nav"
                >
                  Tiếp theo <RightOutlined className="ms-1" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* --- STEP 3: RESULTS --- */}
        {step === 3 && feedback && (
          <div className="step-container result-step px-md-2 animate-fade-in">
            <div className="result-header text-center p-4 mb-4 rounded-4 shadow-sm">
              <TrophyOutlined
                className="mb-2"
                style={{ fontSize: "48px", color: "#faad14" }}
              />
              <h1 className="display-4 fw-bold question-text mb-0">
                {feedback.overallScore}/10
              </h1>
              <p className="text-muted-custom mt-2 mb-3">
                {feedback.generalComment}
              </p>
              <Button variant="outline-primary" size="sm" onClick={handleReset}>
                <ReloadOutlined className="me-1" /> Thực hiện lại bài test
              </Button>
            </div>

            <div className="feedback-list">
              {feedback.details.map((item, idx) => (
                <div
                  key={idx}
                  className={`feedback-card-flat mb-4 ${item.score >= 7 ? "border-success" : "border-danger"}`}
                >
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h6 className="fw-bold text-primary mb-0 pe-3">
                      Q{idx + 1}. {item.question}
                    </h6>
                    <Badge pill bg={item.score >= 7 ? "success" : "danger"}>
                      {item.score}/10
                    </Badge>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="feedback-sub-box success">
                        <small className="d-block fw-bold mb-1 text-success">
                          <CheckCircleOutlined /> ĐIỂM MẠNH
                        </small>
                        <p className="mb-0 small">{item.strengths}</p>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="feedback-sub-box danger">
                        <small className="d-block fw-bold mb-1 text-danger">
                          <CloseCircleOutlined /> CẦN CẢI THIỆN
                        </small>
                        <p className="mb-0 small">{item.improvements}</p>
                      </div>
                    </div>
                  </div>

                  <div className="model-answer-section mt-3">
                    <small className="text-primary fw-bold d-block mb-1">
                      CÂU TRẢ LỜI GỢI Ý:
                    </small>
                    <div className="answer-content">{item.modelAnswer}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default InterviewModal;
