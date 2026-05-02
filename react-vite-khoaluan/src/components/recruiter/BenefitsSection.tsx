// src/components/recruiter/BenefitsSection.tsx

import React from "react";
import { Row, Col, Card } from "react-bootstrap";
import { FaUsers, FaClipboardList, FaBrain } from "react-icons/fa"; // Ví dụ các icon

const BenefitsSection = () => {
  const benefits = [
    {
      icon: <FaUsers size={40} className="text-primary" />,
      title: "Tiếp Cận Nguồn Nhân Lực Khổng Lồ",
      text: "Kết nối với hàng ngàn ứng viên tài năng trên khắp cả nước, từ sinh viên mới ra trường đến các chuyên gia giàu kinh nghiệm.",
    },
    {
      icon: <FaClipboardList size={40} className="text-success" />,
      title: "Đăng Tin & Quản Lý Dễ Dàng",
      text: "Giao diện đăng tin trực quan, hệ thống quản lý hồ sơ ứng viên thông minh giúp bạn tiết kiệm tối đa thời gian và công sức.",
    },
    {
      icon: <FaBrain size={40} className="text-info" />,
      title: "Tìm Kiếm Thông Minh Bằng AI",
      text: "Công nghệ AI của chúng tôi giúp phân tích và gợi ý những ứng viên phù hợp nhất với yêu cầu tuyển dụng của bạn.",
    },
  ];

  return (
    <div className="my-5 py-5 rounded">
      <h2 className="text-center mb-5">Tại Sao Chọn JobHunter?</h2>
      <Row className="px-3">
        {benefits.map((benefit, index) => (
          <Col md={4} key={index} className="mb-4">
            <Card className="text-center h-100 shadow-sm border-0">
              <Card.Body className="p-4">
                <div className="mb-3">{benefit.icon}</div>
                <Card.Title as="h5" className="mb-3">
                  {benefit.title}
                </Card.Title>
                <Card.Text>{benefit.text}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default BenefitsSection;
