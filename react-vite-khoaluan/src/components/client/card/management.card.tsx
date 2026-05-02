import { Col, Row } from "react-bootstrap";
import AnimationLottie from "@/components/share/glowcard/animation-lottie";
import experienceJSON from "assets/lottie/code.json";
import { EXPERIENCES } from "helpers/data";
import GlowCard from "components/share/glowcard/glow-card";
import { BsPersonWorkspace } from "react-icons/bs";
import blurImg from "assets/blur-23.svg";
import { useCurrentApp } from "components/context/app.context";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import bg from "assets/section.svg";
import upload from "assets/upload.svg";
import upload1 from "assets/upload-2-512dodam.png";
import upload2 from "assets/upload-2-512donhat.png";
import upload3 from "assets/upload-2-512tim.png";

type TLanguage = "vi" | "en";

const ManageCV = () => {
  const { theme } = useCurrentApp();
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.resolvedLanguage as TLanguage;

  return (
    <div className="manage-cv-wrapper" style={{ position: "relative" }}>
      {/* Div background */}

      <Row className="mb-5">
        <Col xs={12} className="my-3 my-md-5">
          <div className="text-center">
            <h3 id="title-managecv">{t("manageCV.title")}</h3>
          </div>
        </Col>

        <Col
          md={6}
          xs={12}
          className="d-flex align-items-center justify-content-center"
        >
          <AnimationLottie animationPath={experienceJSON} />
        </Col>

        <Col md={6} xs={12}>
          <div className="d-flex flex-column gap-4">
            {EXPERIENCES.map((experience) => (
              <Link
                to="/resume/create"
                key={experience.id}
                style={{ textDecoration: "none" }}
              >
                <GlowCard identifier={`experience-${experience.id}`}>
                  <div className="p-0 pt-3 p-md-3 relative">
                    {theme === "dark" && (
                      <img
                        style={{
                          position: "absolute",
                          bottom: 0,
                          opacity: 0.8,
                        }}
                        src={blurImg}
                        alt="Hero"
                        width={"100%"}
                        height={200}
                      />
                    )}
                    <div className="experience-container">
                      <div className="duration-text">
                        <p>{experience.duration[currentLanguage]}</p>
                        <span
                          className="wave"
                          role="img"
                          aria-labelledby="wave"
                        >
                          <img src={upload3} alt="" />
                        </span>
                      </div>
                      <div className="details">
                        <div className="icon">
                          <BsPersonWorkspace size={36} />
                        </div>
                        <div className="info">
                          <p className="title">
                            {experience.title[currentLanguage]}
                          </p>
                          <p className="company">
                            {experience.company[currentLanguage]}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </GlowCard>
              </Link>
            ))}
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default ManageCV;
