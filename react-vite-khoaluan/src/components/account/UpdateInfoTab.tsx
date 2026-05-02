// src/components/account/UpdateInfoTab.tsx

import { useState, useEffect } from "react";
import {
  Form,
  Row,
  Col,
  Button,
  Spinner,
  Image,
  Alert,
  Badge,
  FormCheck,
  Stack,
} from "react-bootstrap";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { callUploadSingleFile } from "@/config/api";
import { IUser } from "@/types/backend";
import { toast } from "react-toastify";
import { updateOwnInfo, updatePublicStatus } from "@/redux/slice/accountSlide";

const UpdateInfoTab = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.account.user);

  // State loading
  const [isLoading, setIsLoading] = useState(false);
  const [isPublicLoading, setIsPublicLoading] = useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);

  // State thông báo
  const [alert, setAlert] = useState<{
    show: boolean;
    variant: "success" | "danger";
    message: string;
  } | null>(null);

  // State cho các trường trong form
  const [name, setName] = useState(user.name);
  const [age, setAge] = useState(user.age);
  const [gender, setGender] = useState(user.gender);
  const [address, setAddress] = useState(user.address);

  // --- LOGIC MỚI ---
  // State để lưu tên file avatar đã tải lên tạm thời
  const [newAvatarFileName, setNewAvatarFileName] = useState<string | null>(
    null
  );
  // State để xem trước avatar
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    setName(user.name);
    setAge(user.age);
    setGender(user.gender);
    setAddress(user.address || "");
  }, [user]);

  const handlePublicToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStatus = e.target.checked;
    setIsPublicLoading(true);
    const result = await dispatch(updatePublicStatus({ public: newStatus }));
    if (updatePublicStatus.fulfilled.match(result)) {
      toast.success("Cập nhật trạng thái hồ sơ thành công!");
    } else {
      toast.error("Có lỗi xảy ra, vui lòng thử lại.");
    }
    setIsPublicLoading(false);
  };

  // --- LOGIC MỚI: Chỉ tải file lên và lưu tên file tạm thời ---
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setAvatarPreview(URL.createObjectURL(file)); // Hiển thị ảnh xem trước
    setIsAvatarUploading(true);

    try {
      // 1. Gọi API để tải file lên server
      const uploadRes = await callUploadSingleFile(file, "avatar");

      if (uploadRes?.data?.fileName) {
        // 2. Lưu tên file mới vào state tạm thời
        setNewAvatarFileName(uploadRes.data.fileName);
        toast.success("Ảnh đã được tải lên. Nhấn 'Lưu thay đổi' để hoàn tất.");
      } else {
        throw new Error("Không thể lấy tên file từ server.");
      }
    } catch (error) {
      toast.error("Tải lên avatar thất bại!");
      setAvatarPreview(null); // Trả về ảnh cũ nếu lỗi
    } finally {
      setIsAvatarUploading(false);
    }
  };

  // --- LOGIC MỚI: handleSubmit sẽ gửi tên file avatar mới (nếu có) ---
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setAlert(null);

    // 1. Chuẩn bị payload
    const payload: Partial<IUser> = {
      id: +user.id,
      name,
      age,
      gender,
      address,
      // 2. Nếu có tên file avatar mới thì dùng nó, không thì giữ lại avatar cũ
      avatar: newAvatarFileName || user.avatar,
    };

    // 3. Gửi đi để cập nhật
    const result = await dispatch(updateOwnInfo(payload));

    if (updateOwnInfo.fulfilled.match(result)) {
      setAlert({
        show: true,
        variant: "success",
        message: "Thông tin đã được cập nhật thành công!",
      });
      // 4. Reset state tạm sau khi lưu thành công
      setNewAvatarFileName(null);
      setAvatarPreview(null);
    } else {
      setAlert({
        show: true,
        variant: "danger",
        message: "Có lỗi xảy ra, không thể cập nhật.",
      });
    }
    setIsLoading(false);
  };

  const currentAvatarUrl = user.avatar
    ? `${import.meta.env.VITE_BACKEND_URL}/storage/avatar/${user.avatar}`
    : "/default-avatar.png";

  return (
    <div className="update-info-container">
      {alert?.show && (
        <Alert
          variant={alert.variant}
          onClose={() => setAlert(null)}
          dismissible
        >
          {alert.message}
        </Alert>
      )}
      <Form onSubmit={handleSubmit}>
        <Row>
          <Col md={4} className="text-center mb-4 mb-md-0">
            <Stack gap={3} className="align-items-center">
              <div style={{ position: "relative" }}>
                <Image
                  src={avatarPreview || currentAvatarUrl}
                  roundedCircle
                  width={150}
                  height={150}
                  style={{ objectFit: "cover", border: "3px solid #ddd" }}
                />
                {isAvatarUploading && (
                  <div
                    className="d-flex justify-content-center align-items-center"
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      backgroundColor: "rgba(0,0,0,0.5)",
                      borderRadius: "50%",
                    }}
                  >
                    <Spinner animation="border" variant="light" />
                  </div>
                )}
              </div>

              <Form.Label
                htmlFor="avatar-upload"
                className={`btn btn-sm btn-secondary ${isAvatarUploading ? "disabled" : ""}`}
              >
                Thay đổi Avatar
              </Form.Label>
              <Form.Control
                type="file"
                id="avatar-upload"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: "none" }}
                disabled={isAvatarUploading}
              />
            </Stack>
          </Col>
          <Col md={8}>
            {/* Các trường thông tin khác */}
            <Form.Group as={Row} className="mb-3">
              <Form.Label column sm="3">
                Email
              </Form.Label>
              <Col sm="9">
                <Form.Control
                  type="email"
                  value={user.email!}
                  readOnly
                  plaintext
                />
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="mb-3">
              <Form.Label column sm="3">
                Họ và Tên
              </Form.Label>
              <Col sm="9">
                <Form.Control
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="mb-3">
              <Form.Label column sm="3">
                Tuổi
              </Form.Label>
              <Col sm="9">
                <Form.Control
                  type="number"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  required
                />
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="mb-3">
              <Form.Label column sm="3">
                Giới tính
              </Form.Label>
              <Col sm="9">
                <Form.Select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                  <option value="OTHER">Khác</option>
                </Form.Select>
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="mb-3">
              <Form.Label column sm="3">
                Địa chỉ
              </Form.Label>
              <Col sm="9">
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={address ?? ""}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="mb-3 align-items-center">
              <Form.Label column sm="3">
                Công ty
              </Form.Label>
              <Col sm="9">
                <Form.Control
                  type="text"
                  value={user.company?.name || "Chưa có"}
                  readOnly
                  plaintext
                />
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="mb-3 align-items-center">
              <Form.Label column sm="3">
                Tài khoản VIP
              </Form.Label>
              <Col sm="9">
                {user.vip ? (
                  <Badge bg="success">VIP</Badge>
                ) : (
                  <Badge bg="secondary">Thường</Badge>
                )}
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="mb-3 align-items-center">
              <Form.Label column sm="3">
                Hồ sơ công khai
              </Form.Label>
              <Col sm="9">
                <FormCheck
                  type="switch"
                  id="public-switch"
                  checked={user.public}
                  onChange={handlePublicToggle}
                  disabled={isPublicLoading}
                  label={user.public ? "Đang bật" : "Đang tắt"}
                />
                {isPublicLoading && (
                  <Spinner animation="border" size="sm" className="ms-2" />
                )}
              </Col>
            </Form.Group>
          </Col>
        </Row>
        <Row className="mt-4">
          <Col className="text-end">
            <Button
              variant="primary"
              type="submit"
              disabled={isLoading || isAvatarUploading}
              className="update-btn"
            >
              {isLoading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" /> &nbsp; Đang
                  lưu...
                </>
              ) : (
                "Lưu thay đổi"
              )}
            </Button>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default UpdateInfoTab;
