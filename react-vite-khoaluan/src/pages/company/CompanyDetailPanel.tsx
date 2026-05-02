import { getLocationName } from "@/config/utils";
import { hrCompany, ICompany } from "@/types/backend";
import {
  CalendarOutlined,
  GlobalOutlined,
  HomeOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Divider, Empty, Skeleton, Tag } from "antd";
import parse from "html-react-parser";
import { useEffect, useState } from "react";

// Import file SCSS dùng chung cho các panel chi tiết
import { useCurrentApp } from "@/components/context/app.context";
import { callFetchCompanyById } from "@/config/api";
import { useAppSelector } from "@/redux/hooks";
import upload3 from "assets/top-rated.png";
import { Button } from "react-bootstrap";
import { BsChatDots, BsStarFill } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import "styles/panel-detail.scss";
import CompanyAIReviewModal from "./CompanyAIReviewModal";
import CompanyReviews from "./CompanyReviews";

interface IProps {
  companyId: string;
}

const CompanyDetailPanel = ({ companyId }: IProps) => {
  const [companyDetail, setCompanyDetail] = useState<ICompany | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAIReviewOpen, setIsAIReviewOpen] = useState<boolean>(false);

  const navigate = useNavigate();
  const [hrCompany, setHrCompany] = useState<hrCompany | null>(null);
  const { theme } = useCurrentApp();

  const isAuthenticated = useAppSelector(
    (state) => state.account.isAuthenticated,
  );
  const fetchCompanyDetail = async () => {
    setIsLoading(true);
    const res = await callFetchCompanyById(companyId);
    setCompanyDetail(res?.data ?? null);
    setHrCompany(res?.data?.hrCompany ?? null);
    setIsLoading(false);
  };
  useEffect(() => {
    fetchCompanyDetail();
  }, [companyId]);

  return (
    // Sử dụng class name chung cho panel sticky
    <div className="sticky-panel-container">
      {isLoading ? (
        <div style={{ padding: "1rem" }}>
          <Skeleton active paragraph={{ rows: 15 }} />
        </div>
      ) : companyDetail ? (
        <>
          {/* PHẦN HEADER CỐ ĐỊNH - ĐÃ CẬP NHẬT */}
          <div className="panel-header">
            {/* Cột Trái: Logo */}
            <img
              src={`${import.meta.env.VITE_BACKEND_URL}/storage/company/${
                companyDetail.logo
              }`}
              alt={`${companyDetail.name} logo`}
              className="company-logo"
            />

            {/* Cột Phải: Toàn bộ thông tin */}
            <div className="company-details-wrapper">
              <div className="company-title">
                <h1 className="name">
                  {companyDetail.name}{" "}
                  {companyDetail?.totalJobs! >= 3 && (
                    <span className="wave" role="img" aria-labelledby="wave">
                      <img
                        src={upload3}
                        alt="Wave icon"
                        style={{ width: "30px", height: "30px" }}
                      />
                    </span>
                  )}
                  <button
                    className="btn-success "
                    onClick={() => setIsAIReviewOpen(true)}
                    style={{
                      position: "relative",
                      color: theme === "dark" ? "#fff" : "#000",
                      fontSize: "0.875rem",
                    }}
                  >
                    Review By AI
                  </button>
                </h1>

                <div className="location">
                  <HomeOutlined />
                  &nbsp; {companyDetail.address}
                </div>
              </div>

              <div className="company-stats">
                <div className="stat-item">
                  <TeamOutlined />
                  &nbsp; Quy mô: {companyDetail.scale ?? "N/A"}
                </div>
                <div className="stat-item">
                  <CalendarOutlined />
                  &nbsp; Thành lập: {companyDetail.foundingYear ?? "N/A"}
                </div>
                {companyDetail.website && (
                  <div className="stat-item">
                    <GlobalOutlined />
                    &nbsp;{" "}
                    <a
                      href={companyDetail.website}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Website
                    </a>
                  </div>
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                {/* Khối 1: Rating (Tỷ lệ 2) */}
                <div
                  style={{
                    flex: "1", // Trả lại tỷ lệ 2 như bạn muốn ban đầu
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "0.875rem",
                    color: "#faad14",
                    whiteSpace: "nowrap",
                  }}
                >
                  <BsStarFill />
                  <b style={{ color: theme === "dark" ? "#fff" : "#000" }}>
                    {companyDetail.averageRating
                      ? Number(companyDetail.averageRating).toFixed(1)
                      : "0.0"}
                  </b>
                </div>

                {/* Khối 2: Comments (Tỷ lệ 2) */}
                <div
                  style={{
                    flex: "1", // Trả lại tỷ lệ 2
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "0.875rem",
                    color: theme === "dark" ? "#ccc" : "#666",
                    whiteSpace: "nowrap",
                  }}
                >
                  <BsChatDots /> {companyDetail.totalComments || 0}
                </div>

                {/* Khối 3: Button Nhắn tin (Tỷ lệ 8) */}
                <div style={{ flex: "8", display: "flex" }}>
                  {/* Thêm display: flex ở đây để div bọc cũng xử lý button tốt hơn */}
                  {isAuthenticated ? (
                    <Button
                      onClick={() => {
                        if (!hrCompany) return;
                        navigate("/chat/detail", {
                          state: {
                            receiverId: hrCompany.id,
                            receiver: {
                              ...hrCompany,
                              company: {
                                id: companyDetail?.id,
                                name: companyDetail?.name,
                                logoUrl: companyDetail?.logo,
                              },
                            },
                          },
                        });
                      }}
                      variant="primary"
                      className="w-100"
                      style={{ borderRadius: "50px" }}
                    >
                      Nhắn tin
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      className="w-100" // <--- QUAN TRỌNG: Chiếm 100%
                      disabled={true}
                      style={{ borderRadius: "8px", fontSize: "0.8rem" }}
                    >
                      Đăng nhập để nhắn tin
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* PHẦN NỘI DUNG CUỘN */}
          <div className="panel-content">
            <div className="content-section">
              <strong>Lĩnh vực:&nbsp;</strong>
              <Tag color="cyan">{companyDetail.field || "Chưa cập nhật"}</Tag>
            </div>
            <div className="content-section">
              <strong>Khu vực:&nbsp;</strong>
              <span>{getLocationName(companyDetail?.location!)}</span>
            </div>
            {companyDetail.address && (
              <div className="content-section" style={{ marginTop: "1.5rem" }}>
                <strong>Bản đồ</strong>
                <iframe
                  title={`Bản đồ địa chỉ ${companyDetail.name}`}
                  width="100%"
                  height="300" // Bạn có thể điều chỉnh chiều cao
                  style={{
                    border: 0,
                    borderRadius: "8px",
                    marginTop: "8px",
                  }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(
                    companyDetail.address,
                  )}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                ></iframe>
              </div>
            )}
            <Divider />
            <div className="description-html">
              {parse(
                companyDetail.description ??
                  "<p>Công ty chưa cập nhật mô tả chi tiết.</p>",
              )}
            </div>
            {/* === BẮT ĐẦU TÍCH HỢP REVIEW === */}
            <Divider>
              {" "}
              <span className="review-public">Đánh giá từ cộng đồng</span>
            </Divider>

            <CompanyReviews
              companyId={Number(companyId)}
              companyDetail={companyDetail}
              onCommentSuccess={fetchCompanyDetail}
            />
            {/* === KẾT THÚC TÍCH HỢP REVIEW === */}
          </div>
        </>
      ) : (
        <div style={{ padding: "1.5rem" }}>
          <Empty description="Không thể tải thông tin công ty." />
        </div>
      )}
      <CompanyAIReviewModal
        isOpen={isAIReviewOpen}
        setIsOpen={setIsAIReviewOpen}
        companyId={companyId}
        companyName={companyDetail?.name || ""}
      />
    </div>
  );
};

export default CompanyDetailPanel;
