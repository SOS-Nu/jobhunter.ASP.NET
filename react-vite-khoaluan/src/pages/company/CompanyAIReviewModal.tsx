import { callEvaluateCompany } from "@/config/api";
import "@/styles/company-ai-review.scss";
import {
  InfoCircleOutlined,
  RobotOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { message, Tag } from "antd";
import { useEffect, useState } from "react";
import { Modal, ProgressBar, Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next"; // 1. Import hook

interface IProps {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  companyId: string;
  companyName: string;
}

const CompanyAIReviewModal = (props: IProps) => {
  const { isOpen, setIsOpen, companyId, companyName } = props;
  const { t } = useTranslation();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const language = localStorage.getItem("i18nextLng") || "vi";

  useEffect(() => {
    if (isOpen && companyId) handleEvaluate();
  }, [isOpen, companyId]);

  const handleEvaluate = async () => {
    setIsLoading(true);
    try {
      const res = await callEvaluateCompany(companyId, language);
      if (res?.data) setData(res.data);
    } catch (error) {
      message.error(t("company_review.error")); // i18n cho thông báo lỗi
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      show={isOpen}
      onHide={() => setIsOpen(false)}
      size="lg"
      centered
      className="ai-review-modal"
      backdrop="static"
    >
      <Modal.Header closeButton>
        <Modal.Title>
          <RobotOutlined className="me-2 brand-green" />
          {t("company_review.title")}: {companyName}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {isLoading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 opacity-75">{t("company_review.loading")}</p>
          </div>
        ) : (
          data && (
            <div className="evaluation-content">
              {/* Phần Điểm Tin Cậy */}
              <div className="trust-score-header">
                <SafetyCertificateOutlined
                  style={{ fontSize: "32px", color: "var(--brand-social)" }}
                />
                <h3 className="fw-bold my-2">{data.trustScore}/100</h3>
                <ProgressBar
                  now={data.trustScore}
                  variant={data.trustScore > 70 ? "success" : "warning"}
                  className="mx-auto mb-3"
                  style={{ height: "8px", width: "50%" }}
                />
                <p className="mb-0 small italic opacity-75">
                  {data.overallVerdict}
                </p>
              </div>

              {/* Phần Cảnh Báo Scam */}
              <div
                className={`scam-warning-box ${!data.scamReport.isWarning ? "safe" : ""}`}
              >
                <div className="warning-title">
                  <WarningOutlined className="me-2" />
                  {data.scamReport.isWarning
                    ? t("company_review.scam.warning")
                    : t("company_review.scam.safe")}
                </div>
                <p className="small mb-3">{data.scamReport.detail}</p>
                {data.scamReport.redFlags?.map((flag: string, i: number) => (
                  <div key={i} className="red-flag-tag">
                    {flag}
                  </div>
                ))}
              </div>

              {/* Phần Chi Tiết 2 Cột */}
              <div className="analysis-grid">
                <div className="analysis-card">
                  <div className="card-title">
                    <InfoCircleOutlined /> {t("company_review.benefits.title")}
                  </div>
                  <div className="content-item">
                    <strong>{t("company_review.benefits.insurance")}:</strong>{" "}
                    {data.benefits.insuranceStatus}
                  </div>
                  <div className="content-item">
                    <strong>{t("company_review.benefits.salary")}:</strong>{" "}
                    {data.benefits.salaryReview}
                  </div>
                  <div className="mt-3 flex-wrap gap-1 d-flex">
                    {data.benefits.pros?.map((p: any, i: any) => (
                      <Tag color="green" key={i}>
                        {p}
                      </Tag>
                    ))}
                  </div>
                </div>

                <div className="analysis-card">
                  <div className="card-title">
                    <TeamOutlined /> {t("company_review.environment.title")}
                  </div>
                  <div className="content-item">
                    <strong>{t("company_review.environment.balance")}:</strong>{" "}
                    {data.environment.workLifeBalance}
                  </div>
                  <div className="content-item">
                    <strong>{t("company_review.environment.pressure")}:</strong>{" "}
                    {data.environment.pressureLevel}
                  </div>
                  <div className="content-item">
                    <strong>{t("company_review.environment.culture")}:</strong>{" "}
                    {data.environment.culture}
                  </div>
                </div>
              </div>

              <div className="text-center mt-4">
                <button
                  className="btn-success px-5"
                  onClick={() => setIsOpen(false)}
                >
                  {t("company_review.close_btn")}
                </button>
              </div>
            </div>
          )
        )}
      </Modal.Body>
    </Modal>
  );
};

export default CompanyAIReviewModal;
