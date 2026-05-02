// src/components/recruiter/BecomeVipRecruiter.tsx
import { useState } from "react";
import { Button, Card, Spinner } from "react-bootstrap";
import { Gem } from "react-bootstrap-icons";
import { toast } from "react-toastify";
import { callCreateVipPaymentUrl } from "@/config/api";
import { useAppSelector } from "@/redux/hooks";

const BecomeVipRecruiter = () => {
  const [isCreatingUrl, setIsCreatingUrl] = useState(false);
  const user = useAppSelector((state) => state.account.user);

  const handleRegisterVip = async () => {
    setIsCreatingUrl(true);
    try {
      const res = await callCreateVipPaymentUrl();
      const paymentUrl = res?.data?.data?.url;
      if (paymentUrl) {
        // >>> THÊM DÒNG NÀY <<<
        // Lưu lại "nguồn" của hành động thanh toán
        sessionStorage.setItem("payment_redirect_source", "/recruiter");

        // Điều hướng người dùng đến trang thanh toán
        window.location.href = paymentUrl;
      } else {
        throw new Error("Không nhận được URL thanh toán.");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra, vui lòng thử lại.");
      setIsCreatingUrl(false);
    }
  };

  return (
    <Card className="text-center shadow-sm">
      <Card.Header as="h5">Yêu cầu tài khoản VIP</Card.Header>
      <Card.Body>
        <Gem size={50} className="text-warning mb-3" />
        <Card.Title>Trở thành Nhà tuyển dụng VIP</Card.Title>
        {!user.vip && !user.company && (
          <Card.Text>
            Để đăng tin tuyển dụng và quản lý công ty, bạn cần nâng cấp tài
            khoản của mình thành tài khoản VIP.
          </Card.Text>
        )}
        {!user.vip && user.company && (
          <Card.Text>
            Tài khoản Vip của bạn đã hết hạn! Vui lòng đăng ký tài khoản Vip để
            tiếp tục sử dụng chức năng của Nhà Tuyển dụng
          </Card.Text>
        )}

        <Button
          variant="success"
          size="lg"
          onClick={handleRegisterVip}
          disabled={isCreatingUrl}
        >
          {isCreatingUrl ? (
            <>
              <Spinner size="sm" /> Đang xử lý...
            </>
          ) : (
            "Nâng cấp ngay"
          )}
        </Button>
      </Card.Body>
    </Card>
  );
};

export default BecomeVipRecruiter;
