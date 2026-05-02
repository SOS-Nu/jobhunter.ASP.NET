//search.client.tsx
import { Button, Col, Form, Row, Select, Input, Upload } from "antd";
import {
  SearchOutlined,
  ApartmentOutlined,
  FileTextOutlined,
  UploadOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { getLocationName, LOCATION_LIST } from "@/config/utils";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { clearJobs } from "@/redux/slice/jobSlide";
import Typewriter from "typewriter-effect";
import "@/styles/stylespotfolio/search.client.scss";
import { useCurrentApp } from "../context/app.context";
import { useTranslation } from "react-i18next";

const { Option } = Select;

interface IProps {
  searchType: string;
  onSearchTypeChange: (type: string) => void;
}

const SearchClient = (props: IProps) => {
  const { searchType, onSearchTypeChange } = props;

  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { theme } = useCurrentApp();
  const { t } = useTranslation(); // Lấy hàm t từ hook

  const { isFetching } = useAppSelector((state) => state.job);

  useEffect(() => {
    const searchTypeParam = searchParams.get("search_type");
    const filterParam = searchParams.get("filter");
    const promptParam = searchParams.get("prompt");
    const locationParam = searchParams.get("location");

    if (searchTypeParam === "ai") {
      onSearchTypeChange("ai");
      form.setFieldsValue({
        searchQuery: promptParam,
        location: locationParam,
      });
    } else if (filterParam || location.pathname !== "/") {
      if (location.pathname.startsWith("/job")) onSearchTypeChange("job");
      if (location.pathname.startsWith("/company"))
        onSearchTypeChange("company");

      const nameMatch = filterParam?.match(/name~'([^']*)'/);
      const locationMatch = filterParam?.match(/location~'([^']*)'/);
      const searchQueryValue = nameMatch ? nameMatch[1] : null;
      const savedLocationValue = locationMatch ? locationMatch[1] : null;

      form.setFieldsValue({
        searchQuery: searchQueryValue,
        location: savedLocationValue,
      });
    }
  }, [searchParams, form, location.pathname, onSearchTypeChange]);

  const onFinish = async (values: any) => {
    try {
      const { searchQuery, location: locationValue } = values;

      if (searchType === "ai") {
        dispatch(clearJobs());
        let promptText = searchQuery || t("searchClient.defaultPrompt");
        if (locationValue && locationValue !== "tatca") {
          const locationName = getLocationName(locationValue);
          if (locationName) {
            promptText = `${promptText.trim()} ở ${locationName}`;
          }
        }
        const params = new URLSearchParams();
        params.set("search_type", "ai");
        params.set("prompt", promptText);

        if (locationValue && locationValue !== "tatca") {
          params.set("location", locationValue);
        }
        params.set("page", "1");
        params.set("size", "2");

        navigate(`/job?${params.toString()}`, {
          state: {
            file: fileList.length > 0 ? fileList[0].originFileObj : null,
          },
        });
      } else {
        let filterParts = [];
        if (searchQuery) filterParts.push(`name~'${searchQuery}'`);
        if (locationValue && locationValue !== "tatca")
          filterParts.push(`location~'${locationValue}'`);

        if (filterParts.length === 0) {
          const targetPath = searchType === "job" ? "/job" : "/company";
          navigate(targetPath);
          return;
        }

        const query = `filter=${filterParts.join(" and ")}&sort=updatedAt,desc&page=1&size=2`;
        const targetPath =
          searchType === "job" ? `/job?${query}` : `/company?${query}`;
        navigate(targetPath);
      }
    } catch (error) {
      console.error(t("searchClient.searchError"), error);
    } finally {
      // setIsLoading(false);
    }
  };

  const handleUploadChange = ({ fileList }: { fileList: any[] }) =>
    setFileList(fileList.slice(-1));

  const handleRemoveFile = () => {
    setFileList([]);
    return false;
  };

  const renderSearchInput = () => {
    switch (searchType) {
      case "ai":
        return (
          <div className="ai-input-wrapper">
            <Form.Item name="searchQuery" noStyle>
              <Input.TextArea
                placeholder={t("searchClient.aiPlaceholder")}
                rows={1}
                bordered={false}
                autoSize={{ minRows: 1, maxRows: 1 }}
              />
            </Form.Item>
            <div className="ai-upload-container">
              {fileList.length > 0 ? (
                <div className="custom-upload-item">
                  <span className="file-name-text" title={fileList[0].name}>
                    {fileList[0].name}
                  </span>
                  <CloseOutlined
                    className="delete-icon"
                    onClick={handleRemoveFile}
                  />
                </div>
              ) : (
                <Upload
                  className="ai-upload-button"
                  fileList={fileList}
                  onChange={handleUploadChange}
                  beforeUpload={() => false}
                  showUploadList={false}
                  maxCount={1}
                >
                  <Button icon={<UploadOutlined />} type="text">
                    {" "}
                    {t("searchClient.uploadCV")}{" "}
                  </Button>
                </Upload>
              )}
            </div>
          </div>
        );
      case "company":
        return (
          <div className="ai-input-wrapper">
            <Form.Item name="searchQuery" noStyle>
              <Input
                placeholder={t("searchClient.companyPlaceholder")}
                bordered={false}
              />
            </Form.Item>
          </div>
        );
      case "job":
      default:
        return (
          <div className="ai-input-wrapper">
            <Form.Item name="searchQuery" noStyle>
              <Input
                placeholder={t("searchClient.jobPlaceholder")}
                bordered={false}
              />
            </Form.Item>
          </div>
        );
    }
  };

  return (
    <div className="search-form-container">
      <div className="search-form-overlay">
        <Row justify="center">
          <Col span={24} style={{ textAlign: "center", marginBottom: "20px" }}>
            <h2
              style={{
                ...(theme === "dark"
                  ? {
                      background:
                        "linear-gradient(90deg, #1b74ff, #a880ff 96.79%)",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      color: "transparent",
                      fontWeight: 500,
                    }
                  : { color: "black" }),
                fontWeight: 600,
                marginBottom: "0.25rem",
              }}
            >
              <Typewriter
                options={{
                  strings: [
                    t("searchClient.typewriter1"),
                    t("searchClient.typewriter2"),
                    t("searchClient.typewriter3"),
                  ],
                  autoStart: true,
                  loop: true,
                  deleteSpeed: 120,
                }}
              />
            </h2>
          </Col>
        </Row>
        <Form form={form} onFinish={onFinish}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={17}>
              <div className="search-input-wrapper">
                <Input.Group compact className="custom-input-group">
                  <Select
                    value={searchType}
                    onChange={(value) => onSearchTypeChange(value)}
                    className="search-type-select"
                    dropdownClassName="search-type-dropdown"
                  >
                    <Option value="job">
                      <SearchOutlined /> {t("searchClient.selectJob")}
                    </Option>
                    <Option value="company">
                      <ApartmentOutlined /> {t("searchClient.selectCompany")}
                    </Option>
                    <Option value="ai">
                      <FileTextOutlined /> {t("searchClient.selectAI")}
                    </Option>
                  </Select>
                  {renderSearchInput()}
                </Input.Group>
              </div>
            </Col>
            <Col xs={24} md={4}>
              <div className="search-input-wrapper">
                <div className="custom-input-group">
                  <Form.Item name="location" noStyle>
                    <Select
                      showSearch
                      filterOption={(input, option) =>
                        (option?.label ?? "")
                          .toLowerCase()
                          .normalize("NFD")
                          .replace(/[\u0300-\u036f]/g, "")
                          .includes(
                            input
                              .toLowerCase()
                              .normalize("NFD")
                              .replace(/[\u0300-\u036f]/g, "")
                          )
                      }
                      notFoundContent={t("searchClient.locationNotFound")}
                      allowClear
                      showArrow
                      placeholder={t("searchClient.locationPlaceholder")}
                      optionLabelProp="label"
                      options={LOCATION_LIST}
                      className="location-select-standalone"
                      dropdownClassName="search-type-dropdown"
                      style={{ width: "100%", paddingLeft: "6px" }}
                    />
                  </Form.Item>
                </div>
              </div>
            </Col>
            <Col xs={24} md={3}>
              <Button
                type="primary"
                className="search-action-button"
                loading={isFetching}
                htmlType="submit"
              >
                {t("searchClient.searchButton")}
              </Button>
            </Col>
          </Row>
        </Form>
      </div>
    </div>
  );
};

export default SearchClient;
