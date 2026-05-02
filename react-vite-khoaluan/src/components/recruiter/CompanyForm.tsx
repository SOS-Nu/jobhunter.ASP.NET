// src/components/recruiter/CompanyForm.tsx

import { useState, useEffect } from "react";
import {
  Form,
  Button,
  Card,
  Row,
  Col,
  Spinner,
  Image,
  Stack,
} from "react-bootstrap";
import { ICompany } from "@/types/backend";
import { toast } from "react-toastify";
import {
  callCreateCompanyByUser,
  callUpdateCompanyByUser,
  callUploadSingleFile,
} from "@/config/api";
import { useAppDispatch } from "@/redux/hooks";

import defaultLogo from "@/assets/avatar.svg";
import { fetchAccount } from "@/redux/slice/accountSlide";
import {
  COUNTRY_LIST,
  FIELD_LIST,
  LOCATION_LIST,
  SCALE_LIST,
} from "@/config/utils";
// ===== BẮT ĐẦU VÙNG CODE MỚI/CẬP NHẬT =====
// Giả sử đường dẫn này là chính xác

// ===== KẾT THÚC VÙNG CODE MỚI/CẬP NHẬT =====

interface IProps {
  initialData?: ICompany | null;
}

const CompanyForm = ({ initialData }: IProps) => {
  const [formData, setFormData] = useState<Partial<ICompany>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useAppDispatch();
  const isEditMode = initialData;

  const [isLogoUploading, setIsLogoUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [newLogoFileName, setNewLogoFileName] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  // ===== BẮT ĐẦU VÙNG CODE MỚI/CẬP NHẬT =====
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  // ===== KẾT THÚC VÙNG CODE MỚI/CẬP NHẬT =====

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setLogoPreview(URL.createObjectURL(file));
    setIsLogoUploading(true);

    try {
      const uploadRes = await callUploadSingleFile(file, "company");
      if (uploadRes?.data?.fileName) {
        setNewLogoFileName(uploadRes.data.fileName);
        toast.success("Logo đã được tải lên. Nhấn 'Lưu' để hoàn tất.");
      } else {
        throw new Error("Không thể lấy tên file từ server.");
      }
    } catch (error) {
      toast.error("Tải lên logo thất bại!");
      setLogoPreview(null);
    } finally {
      setIsLogoUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { id, ...restOfFormData } = formData;
      const payload: Partial<ICompany> = {
        ...restOfFormData,
        logo: newLogoFileName || restOfFormData.logo,
      };

      if (isEditMode) {
        const res = await callUpdateCompanyByUser(payload as ICompany);
        toast.success("Cập nhật thông tin công ty thành công!");
        if (res.data) {
          setFormData(res.data);
        }
      } else {
        const res = await callCreateCompanyByUser(payload as ICompany);
        toast.success("Tạo công ty thành công!");
        if (res.data) {
          setFormData(res.data);
        }
      }

      dispatch(fetchAccount());
      setNewLogoFileName(null);
      setLogoPreview(null);
    } catch (error) {
      toast.error("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentLogoUrl = formData.logo
    ? `${import.meta.env.VITE_BACKEND_URL}/storage/company/${formData.logo}`
    : defaultLogo;

  return (
    <Card className="shadow-sm">
      <Card.Header as="h5">
        {isEditMode ? "Quản lý thông tin công ty" : "Tạo hồ sơ công ty"}
      </Card.Header>
      <Card.Body>
        <Form onSubmit={handleSubmit}>
          <Row className="mb-4">
            <Col className="text-center">
              <Stack gap={3} className="align-items-center">
                <div style={{ position: "relative" }}>
                  <Image
                    src={logoPreview || currentLogoUrl}
                    rounded
                    style={{
                      objectFit: "contain",
                      border: "1px solid #ddd",
                      width: "150px",
                      height: "150px",
                    }}
                  />
                  {isLogoUploading && (
                    <div
                      className="d-flex justify-content-center align-items-center"
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        backgroundColor: "rgba(255,255,255,0.7)",
                        borderRadius: "0.25rem",
                      }}
                    >
                      <Spinner animation="border" variant="primary" />
                    </div>
                  )}
                </div>
                <Form.Label
                  htmlFor="logo-upload"
                  className={`btn btn-sm btn-outline-primary ${
                    isLogoUploading ? "disabled" : ""
                  }`}
                >
                  Tải lên Logo
                </Form.Label>
                <Form.Control
                  type="file"
                  id="logo-upload"
                  accept="image/*"
                  onChange={handleLogoChange}
                  style={{ display: "none" }}
                  disabled={isLogoUploading}
                />
              </Stack>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Tên công ty</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Website</Form.Label>
                <Form.Control
                  type="text"
                  name="website"
                  value={formData.website || ""}
                  onChange={handleChange}
                  placeholder="https://example.com"
                />
              </Form.Group>
            </Col>
          </Row>

          {/* ===== BẮT ĐẦU VÙNG CODE MỚI/CẬP NHẬT ===== */}
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Năm thành lập</Form.Label>
                <Form.Control
                  type="number"
                  name="foundingYear"
                  value={formData.foundingYear || ""}
                  onChange={handleChange}
                  placeholder="Vd: 2024"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Quy mô</Form.Label>
                <Form.Select
                  name="scale"
                  value={formData.scale || ""}
                  onChange={handleChange}
                >
                  <option value="" disabled>
                    Chọn quy mô
                  </option>
                  {SCALE_LIST.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Lĩnh vực hoạt động</Form.Label>
                <Form.Select
                  name="field"
                  value={formData.field || ""}
                  onChange={handleChange}
                >
                  <option value="" disabled>
                    Chọn lĩnh vực
                  </option>
                  {FIELD_LIST.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Tỉnh/Thành phố</Form.Label>
                <Form.Select
                  name="location"
                  value={formData.location || ""}
                  onChange={handleChange}
                >
                  <option value="" disabled>
                    Chọn tỉnh/thành phố
                  </option>
                  {LOCATION_LIST.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Quốc gia</Form.Label>
                <Form.Select
                  name="country"
                  value={formData.country || ""}
                  onChange={handleChange}
                >
                  <option value="" disabled>
                    Chọn quốc gia
                  </option>
                  {COUNTRY_LIST.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          {/* ===== KẾT THÚC VÙNG CODE MỚI/CẬP NHẬT ===== */}

          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Địa chỉ</Form.Label>
                <Form.Control
                  type="text"
                  name="address"
                  value={formData.address || ""}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Mô tả công ty</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  name="description"
                  value={formData.description || ""}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
          </Row>
          <div className="text-end">
            <Button
              variant="primary"
              type="submit"
              disabled={isSubmitting || isLogoUploading}
            >
              {isSubmitting ? (
                <Spinner size="sm" />
              ) : isEditMode ? (
                "Lưu thay đổi"
              ) : (
                "Tạo công ty"
              )}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default CompanyForm;
