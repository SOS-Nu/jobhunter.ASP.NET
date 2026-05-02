// @/components/client/card/job.card.tsx (Đã cập nhật)
import { getLocationName } from "@/config/utils";
import styles from "@/styles/client.module.scss";
import { IJob } from "@/types/backend";
import blurImg from "assets/blur-23.svg";
import upload3 from "assets/new-badge-orange.png";
import { useCurrentApp } from "components/context/app.context";
import SimpleGlowCard from "components/share/glowcard/simple.glow-card";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import i18next, { t } from "i18next";
import React from "react"; // Đảm bảo React được import
import { Button, Col } from "react-bootstrap";
import { isMobile } from "react-device-detect";
import { BsClock, BsCurrencyDollar, BsGeoAlt } from "react-icons/bs";
import { Link, useSearchParams } from "react-router-dom";

dayjs.extend(relativeTime);

interface IProps {
  jobs: IJob[] | undefined | null;
  isLoading: boolean;
  title?: string;
  showPagination?: boolean;
  isListPage?: boolean;
  showButtonAllJob?: boolean;
  openInNewTab?: boolean;
}

// Bọc component trong React.memo (bạn đã làm đúng)
const JobCard = (props: IProps) => {
  const {
    jobs,
    isLoading,
    title = t("job.listTitle"),
    showPagination,
    isListPage = false,
    showButtonAllJob,
    openInNewTab = false,
  } = props;
  const { theme } = useCurrentApp();

  const [searchParams] = useSearchParams();
  const selectedJobId = searchParams.get("id");

  // === BẮT ĐẦU TỐI ƯU USEMEMO ===
  // Tính toán trước tất cả các giá trị động cho mỗi job
  const memoizedJobs = React.useMemo(() => {
    return jobs?.map((item) => {
      const relevantDate = item.updatedAt || item.createdAt;
      const isNew = dayjs().diff(dayjs(relevantDate), "day") < 3;
      const isSelected = !openInNewTab && String(item.id) === selectedJobId;

      let linkTo = "";
      let linkTarget: React.HTMLAttributeAnchorTarget = "_self";
      let linkRel: string | undefined = undefined;

      if (openInNewTab) {
        linkTo = `/job/detail/${item.id}`;
        linkTarget = "_blank";
        linkRel = "noopener noreferrer";
      } else {
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.set("id", item.id!);
        linkTo = `/job?${newSearchParams.toString()}`;
      }

      // Trả về một object mới chứa các giá trị đã tính toán
      // để sử dụng trong vòng lặp JSX
      return {
        ...item,
        preCalculated: {
          relevantDate,
          isNew,
          isSelected,
          linkTo,
          linkTarget,
          linkRel,
        },
      };
    });
  }, [jobs, searchParams, openInNewTab, selectedJobId, i18next.language]); // Phụ thuộc
  // === KẾT THÚC TỐI ƯU USEMEMO ===

  return (
    <div className="card-job-section">
      <div className="job-content">
        {isLoading ? (
          <div className="text-center py-4">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">{t("job.loading")}</span>
            </div>
          </div>
        ) : (
          <div className="row g-4">
            <Col xs={12}>
              <div
                className={
                  isMobile ? styles["dflex-mobile"] : styles["dflex-pc"]
                }
              >
                {!isListPage && (
                  <span className={styles["title"]} id="job-tilte-new">
                    {t("job.newjob")}
                  </span>
                )}
                {!showButtonAllJob && (
                  <Col xs={12} md={2}>
                    <Link
                      to="job"
                      style={{ textDecoration: "none", padding: "0px" }}
                    >
                      <Button
                        className="search-action-button"
                        style={{ padding: "0px" }}
                        variant="primary"
                      >
                        {t("job.viewAll")}
                      </Button>
                    </Link>
                  </Col>
                )}
              </div>
            </Col>

            {/* Sử dụng mảng đã được memoized */}
            {memoizedJobs?.map((item) => {
              // Lấy các giá trị đã tính toán
              const {
                relevantDate,
                isNew,
                isSelected,
                linkTo,
                linkTarget,
                linkRel,
              } = item.preCalculated;

              const columnClass = isListPage
                ? "col-12"
                : "col-12 col-sm-6 col-md-4";

              return (
                <div className={columnClass} key={item.id}>
                  <div
                    className={`${isSelected ? "selected-job-card" : ""} h-100`}
                  >
                    <Link
                      to={linkTo} // Dùng giá trị đã tính
                      style={{
                        textDecoration: "none",
                        height: "100%",
                        display: "block",
                      }}
                      target={linkTarget} // Dùng giáGtrị đã tính
                      rel={linkRel} // Dùng giá trị đã tính
                    >
                      <SimpleGlowCard
                        identifier={`job-${item.id}`}
                        className={isSelected ? "selected-job-card" : ""}
                      >
                        <div className="p-0 pt-2 p-md-2 position-relative h-100 d-flex flex-colum">
                          {theme === "dark" && (
                            <img
                              style={{
                                position: "absolute",
                                bottom: 0,
                                opacity: 0.8,
                                width: "100%",
                                height: 200,
                              }}
                              src={blurImg}
                              alt={t("job.blurAlt")}
                            />
                          )}
                          <div className="experience-container">
                            <div className="duration-text">
                              <p
                                style={{
                                  ...(theme === "dark"
                                    ? {
                                        background:
                                          "linear-gradient(-45deg, #ff9100 10%, #ff9100 35%, #ff530f 70%, #e62c6d 100%)",
                                        WebkitBackgroundClip: "text",
                                        backgroundClip: "text",
                                        color: "transparent",
                                      }
                                    : { color: "#000" }),
                                  fontWeight: 600,
                                  marginBottom: "0.25rem",
                                }}
                              >
                                {item.name}
                                {isNew && ( // Dùng giá trị đã tính
                                  <span
                                    className="wave"
                                    role="img"
                                    aria-labelledby="wave"
                                  >
                                    <img
                                      src={upload3}
                                      alt={t("job.newIconAlt")}
                                      style={{
                                        width: "20px",
                                        height: "20px",
                                        marginLeft: "4px",
                                      }}
                                    />
                                  </span>
                                )}
                              </p>
                            </div>
                            <div
                              className="details"
                              style={{ padding: "0.5rem", flexGrow: 1 }}
                            >
                              <div className="icon">
                                <img
                                  alt={t("job.companyLogoAlt")}
                                  src={`${
                                    import.meta.env.VITE_BACKEND_URL
                                  }/storage/company/${item?.company?.logo}`}
                                  style={{
                                    width: "80px",
                                    height: "80px",
                                    objectFit: "cover",
                                    borderRadius: "20px",
                                  }}
                                  loading="lazy" // <-- Thêm tối ưu: lazy load ảnh
                                />
                              </div>
                              <div className="info">
                                <p
                                  className="company"
                                  style={{
                                    color: theme === "dark" ? "#ccc" : "#666",
                                    fontSize: "0.875rem",
                                    marginBottom: "0.25rem",
                                  }}
                                >
                                  {item.company?.name ?? "TechCorp"}
                                </p>
                                <p
                                  className="company"
                                  style={{
                                    color: theme === "dark" ? "#ccc" : "#666",
                                    fontSize: "0.875rem",
                                    marginBottom: "0.25rem",
                                  }}
                                >
                                  <BsGeoAlt
                                    style={{
                                      color:
                                        theme === "dark" ? "#58aaab" : "#000",
                                      marginRight: "6px",
                                    }}
                                  />
                                  {getLocationName(item.location) !== "unknown"
                                    ? getLocationName(item.location)
                                    : item.location}
                                </p>
                                <p
                                  className="company"
                                  style={{
                                    color: theme === "dark" ? "#ccc" : "#666",
                                    fontSize: "0.875rem",
                                    marginBottom: "0.25rem",
                                  }}
                                >
                                  <BsCurrencyDollar
                                    style={{
                                      color:
                                        theme === "dark" ? "orange" : "#000",
                                      marginRight: "6px",
                                      fontSize: "0.875rem",
                                      gap: "1",
                                    }}
                                  />
                                  {t("job.salary", {
                                    value: (item.salary + "").replace(
                                      /\B(?=(\d{3})+(?!\d))/g,
                                      ","
                                    ),
                                  })}
                                </p>
                                <p
                                  className="company"
                                  style={{
                                    color: theme === "dark" ? "#ccc" : "#666",
                                    fontSize: "0.875rem",
                                    marginBottom: "0.25rem",
                                  }}
                                >
                                  <span
                                    style={{
                                      color:
                                        theme === "dark" ? "#58aaab" : "#000",
                                      marginRight: "6px",
                                      fontSize: "0.875rem",
                                    }}
                                  >
                                    📊{" "}
                                  </span>
                                  {item.level || t("job.levelUndefined")}
                                </p>
                                <p
                                  className="time"
                                  style={{
                                    color: theme === "dark" ? "#ccc" : "#666",
                                    fontSize: "0.875rem",
                                    marginBottom: "0.25rem",
                                  }}
                                >
                                  <BsClock
                                    style={{
                                      color:
                                        theme === "dark" ? "#58aaab" : "#000",
                                      marginRight: "6px",
                                      fontSize: "0.875rem",
                                    }}
                                  />
                                  {dayjs(relevantDate) // Dùng giá trị đã tính
                                    .locale(i18next.language)
                                    .fromNow()}
                                </p>
                              </div>
                            </div>
                            <div
                              className="skills"
                              style={{ padding: "0.5rem" }}
                            >
                              <p
                                style={{
                                  color: theme === "dark" ? "#ccc" : "#666",
                                  fontSize: "0.875rem",
                                  marginBottom: "0.5rem",
                                  fontWeight: 500,
                                }}
                              >
                                {t("job.requiredSkills")}
                              </p>
                              <div
                                style={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: "0.5rem",
                                }}
                              >
                                {item.skills?.map((skill, index) => (
                                  <span
                                    key={index}
                                    style={{
                                      backgroundColor:
                                        theme === "dark" ? "#333" : "#f0f0f0",
                                      color: theme === "dark" ? "#fff" : "#333",
                                      padding: "0.2rem 0.4rem",
                                      borderRadius: "0.2rem",
                                      fontSize: "0.75rem",
                                      fontWeight: 500,
                                    }}
                                  >
                                    {skill.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </SimpleGlowCard>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(JobCard); // Giữ nguyên React.memo
