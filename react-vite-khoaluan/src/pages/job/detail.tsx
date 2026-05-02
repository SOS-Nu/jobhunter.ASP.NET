import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { IJob } from "@/types/backend";
import { callFetchJobById } from "@/config/api";
import parse from "html-react-parser";
import { Divider, Skeleton, Tag, Empty } from "antd"; // Loại bỏ Row, Col vì không dùng nữa
import {
  DollarOutlined,
  HistoryOutlined,
  HomeOutlined,
  TeamOutlined,
  CalendarOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { convertSlug, getLocationName } from "@/config/utils";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import ApplyModal from "@/components/client/modal/apply.modal";
import { useCurrentApp } from "@/components/context/app.context";
import "styles/panel-detail.scss";

dayjs.extend(relativeTime);

const ClientJobStandaloneDetailPage = () => {
  const [jobDetail, setJobDetail] = useState<IJob | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const { id } = useParams<{ id: string }>();
  const { theme } = useCurrentApp();

  useEffect(() => {
    const fetchJobDetail = async () => {
      if (id) {
        setIsLoading(true);
        const res = await callFetchJobById(id);
        setJobDetail(res?.data ?? null);
        console.log("Kiểm tra dữ liệu jobDetail:", jobDetail);

        setIsLoading(false);
      }
    };
    fetchJobDetail();
  }, [id]);

  const formatSalary = (salary: number | undefined | null) => {
    if (salary === null || salary === undefined) {
      return "Thoả thuận";
    }
    return (salary + "").replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " đ";
  };

  console.log("Kiểm tra dữ liệu jobDetail:", jobDetail);

  return (
    <div className="container" style={{ marginTop: 20, marginBottom: 40 }}>
      {/* Dòng <Row> và <Col> đã được gỡ bỏ khỏi đây */}
      <div
        className="right-panel-container"
        style={{
          position: "relative",
          top: 0,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        }}
      >
        {isLoading ? (
          <div style={{ padding: "2rem" }}>
            <Skeleton active paragraph={{ rows: 15 }} />
          </div>
        ) : !id || !jobDetail ? (
          <div
            className="empty-detail-placeholder"
            style={{ minHeight: "50vh" }}
          >
            <Empty
              description="Công việc không tồn tại hoặc đã bị xóa."
              className="empty-detail-placeholder-text"
            />
          </div>
        ) : (
          <>
            <div className="job-detail-header">
              <div className="company-info">
                <img
                  src={`${import.meta.env.VITE_BACKEND_URL}/storage/company/${jobDetail.company?.logo ?? "default-logo.png"}`}
                  alt={jobDetail.company?.name ?? "company logo"}
                  className="company-logo"
                />
                <div className="job-info">
                  <h1 className="header">
                    {jobDetail.name ?? "Tên công việc"}
                  </h1>
                  {jobDetail.company ? (
                    <Link
                      to={`/company/${convertSlug(jobDetail.company.name ?? "")}?id=${jobDetail.company.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="company-name"
                      style={{
                        ...(theme === "dark"
                          ? {
                              background:
                                "linear-gradient(90deg, #1b74ff, #a880ff 96.79%)",
                              WebkitBackgroundClip: "text",
                              backgroundClip: "text",
                              color: "transparent",
                              textDecoration: "none",
                            }
                          : { color: "#000", textDecoration: "none" }),
                        fontWeight: 600,
                      }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.textDecoration = "underline")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.textDecoration = "none")
                      }
                    >
                      {jobDetail.company.name}
                    </Link>
                  ) : (
                    <div className="company-name">Tên công ty</div>
                  )}
                </div>
              </div>
              {jobDetail.company && (
                <div className="company-details-bottom">
                  <div className="company-scale">
                    <TeamOutlined />
                    &nbsp;
                    <span>
                      {jobDetail.company.scale ?? "Chưa cập nhật quy mô"}
                    </span>
                  </div>
                  <div className="company-founding-year">
                    <CalendarOutlined />
                    &nbsp;
                    <span>
                      {jobDetail.company.foundingYear
                        ? `Thành lập năm ${jobDetail.company.foundingYear}`
                        : "Chưa cập nhật"}
                    </span>
                  </div>
                </div>
              )}
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn-apply"
              >
                Apply Now
              </button>
            </div>

            <div className="job-detail-content">
              {jobDetail.company && (
                <div className="company-details-bottom">
                  <div className="company-address">
                    <HomeOutlined />
                    &nbsp;
                    <span>
                      {jobDetail.company.address ?? "Chưa cập nhật địa chỉ"} -{" "}
                      {getLocationName(jobDetail.location)}
                    </span>
                  </div>
                </div>
              )}

              <div className="skills">
                <strong>Kỹ năng:</strong>&nbsp;
                {jobDetail.skills && jobDetail.skills.length > 0
                  ? jobDetail.skills.map((item) => (
                      <Tag key={item.id} color="gold">
                        {item.name}
                      </Tag>
                    ))
                  : "Chưa yêu cầu"}
              </div>
              <div className="salary">
                <DollarOutlined />
                &nbsp;
                <strong>Lương:</strong>&nbsp;
                <span>{formatSalary(jobDetail.salary)}</span>
              </div>
              <div className="quantity">
                <UserOutlined />
                &nbsp;
                <strong>Số lượng:</strong>&nbsp;
                <span>{jobDetail.quantity ?? "Không giới hạn"}</span>
              </div>
              <div>
                <HistoryOutlined />
                &nbsp; Cập nhật&nbsp;
                {dayjs(jobDetail.updatedAt || jobDetail.createdAt)
                  .locale("vi")
                  .fromNow()}
              </div>
              <Divider />
              <div className="job-description">
                {parse(
                  jobDetail.description || "<p>Chưa có mô tả chi tiết.</p>"
                )}
              </div>
            </div>
          </>
        )}

        <ApplyModal
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          jobDetail={jobDetail}
        />
      </div>
    </div>
  );
};

export default ClientJobStandaloneDetailPage;
