//file footer.client.tsx
import { Accordion, Button, Col, Container, Form, Row } from "react-bootstrap";
import { useTranslation } from "react-i18next"; // Import hook
import {
  FaDribbble,
  FaFacebook,
  FaGithub,
  FaGooglePlay,
  FaInstagram,
  FaTwitter,
} from "react-icons/fa";
import { FaApple } from "react-icons/fa6";
import { useInView } from "react-intersection-observer";
import { useMediaQuery } from "react-responsive"; // Cần cài: npm install react-responsive

const Footer = () => {
  const isMobile = useMediaQuery({ query: "(max-width: 767px)" }); // 767px là breakpoint 'md' của Bootstrap
  const { t } = useTranslation(); // Sử dụng hook useTranslation

  // Xây dựng cấu trúc links từ file ngôn ngữ
  const footerLinks = {
    about: {
      title: t("footer.about.title"),
      items: t("footer.about.items", { returnObjects: true }) as string[],
    },
    services: {
      title: t("footer.services.title"),
      items: t("footer.services.items", { returnObjects: true }) as string[],
    },
    career: {
      title: t("footer.career.title"),
      items: t("footer.career.items", { returnObjects: true }) as string[],
    },
    contact: {
      title: t("footer.contact.title"),
      items: [
        {
          type: "text",
          label: t("footer.contact.hotline"),
          value: "+84 123456789",
        },
        {
          type: "text",
          label: t("footer.contact.email"),
          value: "Nhóm 34 - MIS nhung@gmail.com",
        },
      ],
    },
  };

  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1, // Giảm ngưỡng để kích hoạt sớm hơn
  });

  return (
    <footer
      ref={ref}
      className={`site-footer animate-on-scroll ${inView ? "is-visible" : ""}`}
    >
      <Container>
        <div className="footer-top py-4 py-lg-4 pt-lg-5">
          <Row className="g-4 g-lg-5">
            <Col lg={7} xl={8}>
              {isMobile ? (
                // Giao diện Accordion trên Mobile
                <Accordion flush>
                  {/* --- Giới thiệu --- */}
                  <Accordion.Item
                    eventKey="0"
                    className="footer-accordion-item"
                  >
                    <Accordion.Header>
                      {footerLinks.about.title}
                    </Accordion.Header>
                    <Accordion.Body>
                      <ul>
                        {footerLinks.about.items.map((item, index) => (
                          <li key={index}>
                            <a href="#">{item}</a>
                          </li>
                        ))}
                      </ul>
                    </Accordion.Body>
                  </Accordion.Item>

                  {/* --- Dịch vụ --- */}
                  <Accordion.Item
                    eventKey="1"
                    className="footer-accordion-item"
                  >
                    <Accordion.Header>
                      {footerLinks.services.title}
                    </Accordion.Header>
                    <Accordion.Body>
                      <ul>
                        {footerLinks.services.items.map((item, index) => (
                          <li key={index}>
                            <a href="#">{item}</a>
                          </li>
                        ))}
                      </ul>
                    </Accordion.Body>
                  </Accordion.Item>

                  {/* --- Nghề nghiệp --- */}
                  <Accordion.Item
                    eventKey="2"
                    className="footer-accordion-item"
                  >
                    <Accordion.Header>
                      {footerLinks.career.title}
                    </Accordion.Header>
                    <Accordion.Body>
                      <ul>
                        {footerLinks.career.items.map((item, index) => (
                          <li key={index}>
                            <a href="#">{item}</a>
                          </li>
                        ))}
                      </ul>
                    </Accordion.Body>
                  </Accordion.Item>

                  {/* --- Liên hệ --- */}
                  <Accordion.Item
                    eventKey="3"
                    className="footer-accordion-item"
                  >
                    <Accordion.Header>
                      {footerLinks.contact.title}
                    </Accordion.Header>
                    <Accordion.Body>
                      {/* Cấu trúc của 'contact' khác, nên ta render khác đi */}
                      <ul>
                        {footerLinks.contact.items.map((item, index) => (
                          <li key={index} className="contact-item">
                            <span>{item.label}</span>
                            <span className="contact-value">{item.value}</span>
                          </li>
                        ))}
                      </ul>
                    </Accordion.Body>
                  </Accordion.Item>
                </Accordion>
              ) : (
                // Giao diện Cột như cũ trên Desktop
                <Row className="g-4">
                  {/* --- Cột Giới thiệu --- */}
                  <Col
                    xs={6}
                    md={3}
                    className="footer-links"
                    style={{ animationDelay: "100ms" }}
                  >
                    <h6 className="footer-title">{footerLinks.about.title}</h6>
                    <ul>
                      {footerLinks.about.items.map((item, index) => (
                        <li key={index}>
                          <a href="#">{item}</a>
                        </li>
                      ))}
                    </ul>
                  </Col>

                  {/* --- Cột Dịch vụ --- */}
                  <Col
                    xs={6}
                    md={3}
                    className="footer-links"
                    style={{ animationDelay: "200ms" }}
                  >
                    <h6 className="footer-title">
                      {footerLinks.services.title}
                    </h6>
                    <ul>
                      {footerLinks.services.items.map((item, index) => (
                        <li key={index}>
                          <a href="#">{item}</a>
                        </li>
                      ))}
                    </ul>
                  </Col>

                  {/* --- Cột Nghề nghiệp --- */}
                  <Col
                    xs={6}
                    md={3}
                    className="footer-links"
                    style={{ animationDelay: "300ms" }}
                  >
                    <h6 className="footer-title">{footerLinks.career.title}</h6>
                    <ul>
                      {footerLinks.career.items.map((item, index) => (
                        <li key={index}>
                          <a href="#">{item}</a>
                        </li>
                      ))}
                    </ul>
                  </Col>

                  {/* --- Cột Liên hệ --- */}
                  <Col
                    xs={6}
                    md={3}
                    className="footer-links"
                    style={{ animationDelay: "400ms" }}
                  >
                    <h6 className="footer-title">
                      {footerLinks.contact.title}
                    </h6>
                    <ul>
                      {footerLinks.contact.items.map((item, index) => (
                        <li key={index} className="contact-item">
                          <span>{item.label}</span>
                          <span className="contact-value">{item.value}</span>
                        </li>
                      ))}
                    </ul>
                  </Col>
                </Row>
              )}
            </Col>

            <Col
              lg={5}
              xl={4}
              className="mt-0 mt-lg-0"
              style={{ animationDelay: "500ms", paddingTop: "30px" }}
            >
              <div className="newsletter-box">
                <Form>
                  <Form.Group className="mb-3" controlId="newsletterEmail">
                    <Form.Label className="fw-semibold mb-2">
                      {t("footer.newsletter.title")}
                    </Form.Label>
                    <div className="d-flex">
                      <Form.Control
                        type="email"
                        placeholder={t("footer.newsletter.placeholder")}
                        className="me-2"
                      />
                      <Button type="submit" className="resize-button">
                        {t("footer.newsletter.button")}
                      </Button>
                    </div>
                  </Form.Group>
                </Form>
                <hr className="divider my-4" />
                <div>
                  <p className="fw-semibold mb-3">{t("footer.app.title")}</p>
                  <div className="d-flex gap-3">
                    <a href="#" className="app-download-btn">
                      <FaGooglePlay className="app-icon" />
                      <div>
                        <div className="text-xs">
                          {t("footer.app.download")}
                        </div>
                        <div className="font-sans fw-semibold">
                          {t("footer.app.googlePlay")}
                        </div>
                      </div>
                    </a>
                    <a href="#" className="app-download-btn">
                      <FaApple className="app-icon" />
                      <div>
                        <div className="text-xs">
                          {t("footer.app.download")}
                        </div>
                        <div className="font-sans fw-semibold">
                          {t("footer.app.appStore")}
                        </div>
                      </div>
                    </a>
                  </div>
                </div>
                <hr className="divider my-3 my-lg-4" />
                <div className="d-flex justify-content-start gap-4 social-icons">
                  <a href="#">
                    <FaFacebook />
                  </a>
                  <a href="#">
                    <FaInstagram />
                  </a>
                  <a href="#">
                    <FaTwitter />
                  </a>
                  <a href="#">
                    <FaGithub />
                  </a>
                  <a href="#">
                    <FaDribbble />
                  </a>
                </div>
              </div>
            </Col>
          </Row>
        </div>

        <div className="footer-bottom py-3 py-lg-4">
          <p className="mb-0 text-center">
            {t("footer.copyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
