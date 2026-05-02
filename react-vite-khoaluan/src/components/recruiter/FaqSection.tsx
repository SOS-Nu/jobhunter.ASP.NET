// src/components/recruiter/FaqSection.tsx

import React from "react";
import { Accordion } from "react-bootstrap";

const FaqSection = () => {
  const faqs = [
    {
      question: "Làm thế nào để tôi có thể đăng tin tuyển dụng?",
      answer:
        "Sau khi tài khoản của bạn được nâng cấp thành VIP và đã tạo hồ sơ công ty, bạn sẽ thấy nút 'Đăng tin mới' trong trang quản lý của mình. Quá trình đăng tin rất đơn giản và chỉ mất vài phút.",
    },
    {
      question: "Chi phí để trở thành nhà tuyển dụng VIP là bao nhiêu?",
      answer:
        "Chúng tôi có nhiều gói VIP với các mức giá và quyền lợi khác nhau. Vui lòng tham khảo trang 'Nâng cấp VIP' hoặc liên hệ với bộ phận hỗ trợ để được tư vấn chi tiết.",
    },
    {
      question:
        "Hồ sơ công ty và tin tuyển dụng của tôi có được bảo mật không?",
      answer:
        "Chúng tôi cam kết bảo mật tuyệt đối mọi thông tin của bạn. Dữ liệu của bạn sẽ được mã hóa và chỉ được sử dụng cho mục đích tuyển dụng trên nền tảng JobHunter.",
    },
  ];

  return (
    <div className="my-5">
      <h2 className="text-center mb-5">Câu Hỏi Thường Gặp</h2>
      <Accordion defaultActiveKey="0">
        {faqs.map((faq, index) => (
          <Accordion.Item eventKey={String(index)} key={index}>
            <Accordion.Header>{faq.question}</Accordion.Header>
            <Accordion.Body>{faq.answer}</Accordion.Body>
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  );
};

export default FaqSection;
