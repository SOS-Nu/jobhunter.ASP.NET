// src/components/recruiter/CandidateSearchForm.tsx

import React, { useState } from "react";
import { Button, Card, Form } from "react-bootstrap";
import { toast } from "react-toastify";

import { callFindCandidatesWithAI } from "@/config/api";
import { ICandidate, IMeta } from "@/types/backend";

interface IProps {
  setIsSearching: (isSearching: boolean) => void;
  setCandidates: (candidates: ICandidate[]) => void;
  setMeta: (meta: IMeta | null) => void;
  onNewSearch: (formData: FormData) => void;
}

const CandidateSearchForm = (props: IProps) => {
  const { setIsSearching, setCandidates, setMeta, onNewSearch } =
    props;

  const [jobDescription, setJobDescription] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!jobDescription && !cvFile) {
      toast.error("Vui lòng nhập mô tả công việc hoặc tải lên file mô tả.");
      return;
    }

    // 1. Chuẩn bị dữ liệu form
    const formData = new FormData();
    if (jobDescription) {
      formData.append("jobDescription", jobDescription);
    }
    if (cvFile) {
      formData.append("file", cvFile);
    }

    // 2. Thông báo cho parent về cuộc tìm kiếm mới (để lưu formData cho pagination)
    onNewSearch(formData);
    setIsSearching(true);

    try {
      // 3. Gọi API tìm kiếm trực tiếp
      const res = await callFindCandidatesWithAI(formData, "page=0&size=10");

      if (res.data?.result) {
        // 4. Cập nhật kết quả
        setCandidates(res.data.result);
        setMeta(res.data.meta);

        toast.success(
          `Tìm thấy ${res.data.result.length} ứng viên phù hợp!`
        );
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra trong quá trình tìm kiếm.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <Card.Header as="h5">Tìm kiếm ứng viên thông minh</Card.Header>
      <Card.Body>
        <p>
          Nhập mô tả công việc hoặc tải lên file mô tả để AI tìm giúp bạn những
          ứng viên phù hợp nhất.
        </p>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>1. Mô tả công việc (Job Description)</Form.Label>
            <Form.Control
              as="textarea"
              rows={8}
              placeholder="I. Mô tả công việc..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </Form.Group>

          <div className="text-center my-3 fw-bold">HOẶC</div>

          <Form.Group className="mb-3">
            <Form.Label>2. Tải lên một file mô tả</Form.Label>
            <Form.Control
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                if (e.target.files) {
                  setCvFile(e.target.files[0]);
                }
              }}
            />
          </Form.Group>

          <Button variant="primary" type="submit">
            <i className="bi bi-search me-2"></i>
            Tìm kiếm
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default CandidateSearchForm;
