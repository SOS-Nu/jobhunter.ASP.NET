// src/components/client/JobFilter.tsx

import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const LEVELS = ["INTERN", "FRESHER", "JUNIOR", "MIDDLE", "SENIOR"];

interface IFilterData {
  levels: string[];
  salary: { min: string; max: string };
  sortSalary: string;
  sortTime: string;
}

interface IProps {
  onFilter: (filterData: IFilterData) => void;
}

const JobFilter = (props: IProps) => {
  const { onFilter } = props;
  const [searchParams] = useSearchParams();

  // Các state vẫn giữ nguyên
  const [sortSalary, setSortSalary] = useState<string>("");
  const [sortTime, setSortTime] = useState<string>("newest");
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [minSalary, setMinSalary] = useState<string>("");
  const [maxSalary, setMaxSalary] = useState<string>("");

  // useEffect không cần thay đổi
  useEffect(() => {
    const filterParam = searchParams.get("filter") || "";
    const sortParam = searchParams.get("sort") || "updatedAt,desc";

    const levelGroupMatch = filterParam.match(/\(([^)]+)\)/);
    let currentLevels: string[] = [];
    if (levelGroupMatch && levelGroupMatch[1]) {
      const levelMatches = levelGroupMatch[1].matchAll(
        /level\s*=\s*'([^']+)'/g
      );
      currentLevels = Array.from(levelMatches, (match) => match[1]);
    } else {
      const singleLevelMatch = filterParam.match(/level\s*=\s*'([^']+)'/);
      if (singleLevelMatch) {
        currentLevels = [singleLevelMatch[1]];
      }
    }
    setSelectedLevels(currentLevels);
    const minSalaryMatch = filterParam.match(/salary\s*>=\s*(\d+)/);
    setMinSalary(minSalaryMatch ? minSalaryMatch[1] : "");
    const maxSalaryMatch = filterParam.match(/salary\s*<=\s*(\d+)/);
    setMaxSalary(maxSalaryMatch ? maxSalaryMatch[1] : "");

    if (sortParam.startsWith("salary")) {
      setSortSalary(sortParam.includes("desc") ? "desc" : "asc");
      setSortTime("");
    } else {
      setSortTime(sortParam.includes("asc") ? "oldest" : "newest");
      setSortSalary("");
    }
  }, [searchParams]);

  // >>> LOGIC MỚI: Hàm xử lý nhập liệu cho ô lương <<<
  const handleSalaryInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    // 1. Loại bỏ dấu phẩy để lấy giá trị số thô
    const rawValue = e.target.value.replace(/,/g, "");
    // 2. Chỉ cho phép nhập số hoặc chuỗi rỗng
    if (/^\d*$/.test(rawValue)) {
      // 3. Cập nhật state với giá trị số thô
      setter(rawValue);
    }
  };

  // >>> LOGIC MỚI: Hàm định dạng số để hiển thị ra UI <<<
  const formatSalaryDisplay = (value: string) => {
    if (!value) return ""; // Nếu rỗng thì thôi
    const number = parseInt(value, 10);
    // Dùng toLocaleString để tự động thêm dấu phẩy theo chuẩn Việt Nam
    return number.toLocaleString("en-US"); // Code mới
  };

  const handleLevelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setSelectedLevels((prev) =>
      checked ? [...prev, value] : prev.filter((level) => level !== value)
    );
  };

  const handleSalarySortChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSortSalary(e.target.value);
    setSortTime("");
  };

  const handleTimeSortChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSortTime(e.target.value);
    setSortSalary("");
  };

  const handleApplyFilter = () => {
    onFilter({
      levels: selectedLevels,
      salary: { min: minSalary, max: maxSalary },
      sortSalary: sortSalary,
      sortTime: sortTime,
    });
  };

  return (
    <div className="job-filter-container bg-body-tertiary p-3 rounded mb-4 border">
      <div className="row g-3 align-items-start">
        {/* Các cột khác giữ nguyên */}
        <div className="col-12 col-md-3">
          <label className="form-label text-body-secondary">Trình độ</label>
          <div className="d-flex flex-wrap gap-3">
            {LEVELS.map((level) => (
              <div className="form-check" key={level}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  value={level}
                  id={`level-${level}`}
                  checked={selectedLevels.includes(level)}
                  onChange={handleLevelChange}
                />
                <label
                  className="form-check-label text-body"
                  htmlFor={`level-${level}`}
                >
                  {level}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* CẬP NHẬT CỘT LƯƠNG */}
        <div className="col-12 col-md-3">
          <label className="form-label text-body-secondary">
            Mức lương (VND)
          </label>
          <div className="input-group">
            <input
              type="text" // 1. Đổi type="number" thành "text"
              className="form-control"
              placeholder="Từ"
              value={formatSalaryDisplay(minSalary)} // 2. Hiển thị giá trị đã định dạng
              onChange={(e) => handleSalaryInputChange(e, setMinSalary)} // 3. Dùng handler mới
            />
            <span className="input-group-text">-</span>
            <input
              type="text" // 1. Đổi type="number" thành "text"
              className="form-control"
              placeholder="Đến"
              value={formatSalaryDisplay(maxSalary)} // 2. Hiển thị giá trị đã định dạng
              onChange={(e) => handleSalaryInputChange(e, setMaxSalary)} // 3. Dùng handler mới
            />
          </div>
        </div>

        {/* Các cột sắp xếp và nút button giữ nguyên */}
        <div className="col-12 col-md-2">
          <label className="form-label text-body-secondary">
            Sắp xếp lương
          </label>
          <div className="d-flex flex-column">
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                name="salarySort"
                id="sortAsc"
                value="asc"
                checked={sortSalary === "asc"}
                onChange={handleSalarySortChange}
              />
              <label className="form-check-label text-body" htmlFor="sortAsc">
                Tăng dần
              </label>
            </div>
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                name="salarySort"
                id="sortDesc"
                value="desc"
                checked={sortSalary === "desc"}
                onChange={handleSalarySortChange}
              />
              <label className="form-check-label text-body" htmlFor="sortDesc">
                Giảm dần
              </label>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-2">
          <label className="form-label text-body-secondary">
            Sắp xếp thời gian
          </label>
          <div className="d-flex flex-column">
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                name="timeSort"
                id="sortNewest"
                value="newest"
                checked={sortTime === "newest"}
                onChange={handleTimeSortChange}
              />
              <label
                className="form-check-label text-body"
                htmlFor="sortNewest"
              >
                Mới nhất
              </label>
            </div>
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                name="timeSort"
                id="sortOldest"
                value="oldest"
                checked={sortTime === "oldest"}
                onChange={handleTimeSortChange}
              />
              <label
                className="form-check-label text-body"
                htmlFor="sortOldest"
              >
                Cũ nhất
              </label>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-2 align-self-end">
          <button className="btn btn-primary w-100" onClick={handleApplyFilter}>
            Áp dụng
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobFilter;
