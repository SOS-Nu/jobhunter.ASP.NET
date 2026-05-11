import { useState, useRef } from "react";
import { Button, Card, Form, Spinner } from "react-bootstrap";
import { Pagination } from "antd";
import { toast } from "react-toastify";
import { callSearchCandidatesBySkills, callFetchAllSkill } from "@/config/api";
import { ICandidate, IUser, IMeta } from "@/types/backend";
import CandidateResults from "./CandidateResults";
import { DebounceSelect } from "../admin/user/debouce.select";

const SkillSearchTab = () => {
    const [isSearching, setIsSearching] = useState(false);
    const [candidates, setCandidates] = useState<ICandidate[]>([]);
    const [meta, setMeta] = useState<IMeta | null>(null);
    const [selectedSkills, setSelectedSkills] = useState<any[]>([]);
    const resultsRef = useRef<HTMLDivElement>(null);

    const fetchSkillList = async (name: string) => {
        const res = await callFetchAllSkill(`page=1&pageSize=100&name@=${name}`);
        if (res && res.data) {
            return res.data.result.map(s => ({
                label: s.name,
                value: s.name // Use name for value to simplify searching
            }));
        }
        return [];
    };

    const handleSearch = async (page: number = 1, pageSize: number = 10) => {
        if (selectedSkills.length === 0) {
            toast.error("Vui lòng chọn ít nhất một kỹ năng");
            return;
        }

        setIsSearching(true);

        // Scroll to results
        if (resultsRef.current) {
            const yOffset = -100;
            const elementPosition = resultsRef.current.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.scrollY + yOffset;
            window.scrollTo({ top: offsetPosition, behavior: "smooth" });
        }

        try {
            // Join labels for the backend query
            const skillsQuery = selectedSkills.map(s => s.label).join(",");
            const paginationQuery = `page=${page}&pageSize=${pageSize}`;
            const res = await callSearchCandidatesBySkills(skillsQuery, paginationQuery);

            if (res.data) {
                // Map IUser to ICandidate (set score to 100 for direct skill matches)
                const mappedCandidates: ICandidate[] = (res.data.result || []).map(u => ({
                    score: 100,
                    user: u
                }));
                setCandidates(mappedCandidates);
                setMeta(res.data.meta);
                
                if (page === 1) {
                    toast.success(`Tìm thấy ${res.data.meta.total} ứng viên có kỹ năng tương ứng!`);
                }
            }
        } catch (error) {
            toast.error("Có lỗi xảy ra khi tìm kiếm ứng viên.");
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="mt-3">
            <Card className="shadow-sm mb-4">
                <Card.Header as="h5">Tìm kiếm ứng viên theo kỹ năng</Card.Header>
                <Card.Body>
                    <p className="text-muted">
                        Chọn các kỹ năng chuyên môn để tìm kiếm ứng viên từ kho dữ liệu Resume Online.
                    </p>
                    <Form.Group className="mb-4">
                        <Form.Label className="fw-bold">1. Kỹ năng cần tìm</Form.Label>
                        <DebounceSelect
                            mode="multiple"
                            value={selectedSkills}
                            placeholder="Ví dụ: React, Java, SQL, Python..."
                            fetchOptions={fetchSkillList}
                            onChange={(newValue) => setSelectedSkills(newValue as any[])}
                            style={{ width: '100%', minHeight: '45px' }}
                        />
                    </Form.Group>
                    <Button 
                        variant="primary" 
                        size="lg"
                        onClick={() => handleSearch(1, 10)}
                        disabled={isSearching}
                    >
                        <i className="bi bi-search me-2"></i>
                        {isSearching ? "Đang tìm..." : "Tìm kiếm ứng viên"}
                    </Button>
                </Card.Body>
            </Card>

            <div ref={resultsRef} style={{ minHeight: '200px' }}>
                {isSearching && (
                    <div className="text-center my-5">
                        <Spinner animation="border" variant="primary" />
                        <p className="mt-2 fw-medium text-primary">Đang quét kho dữ liệu ứng viên...</p>
                    </div>
                )}

                {!isSearching && candidates.length > 0 && (
                    <>
                        <CandidateResults candidates={candidates} />
                        {meta && meta.total > 0 && (
                            <div className="d-flex justify-content-center mt-5 mb-4">
                                <Pagination
                                    current={meta.page}
                                    total={meta.total}
                                    pageSize={meta.pageSize}
                                    onChange={(page, pageSize) => handleSearch(page, pageSize)}
                                    showSizeChanger
                                    responsive
                                />
                            </div>
                        )}
                    </>
                )}

                {!isSearching && candidates.length === 0 && selectedSkills.length > 0 && (
                    <div className="text-center my-5 text-muted">
                        <i className="bi bi-person-x" style={{ fontSize: '3rem' }}></i>
                        <p className="mt-2">Không tìm thấy ứng viên nào phù hợp với bộ kỹ năng đã chọn.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SkillSearchTab;
