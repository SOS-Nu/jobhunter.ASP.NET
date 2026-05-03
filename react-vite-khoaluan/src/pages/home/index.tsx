//home/index.tsx
import ManageCV from "@/components/client/card/management.card";
import SearchClient from "@/components/client/search.client";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { Divider } from "antd";
import { lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import styles from "styles/client.module.scss";
// >> THÊM MỚI: import useState
import { useCurrentApp } from "@/components/context/app.context";
import { VueHeroWrapper } from "@/components/HeroAnimation/VueHeroWrapper";
import { fetchCompany } from "@/redux/slice/companySlide";
import { fetchJob } from "@/redux/slice/jobSlide";
import { IUser } from "@/types/backend";
import bg from "assets/top-bg.svg";
import { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { isMobile } from "react-device-detect";
import { useTranslation } from "react-i18next";

const JobCard = lazy(() => import("@/components/client/card/job.card"));
const CompanyCard = lazy(() => import("@/components/client/card/company.card"));
const Introduction = lazy(
  () => import("@/components/client/introduction/introduction"),
);
const Skill = lazy(() => import("../skill"));
const Banner = lazy(() => import("@/components/client/introduction/banner"));

const HomePage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const theme = useCurrentApp().theme;

  const { t } = useTranslation(); // Lấy hàm t từ hook

  // >> THÊM MỚI: Thêm state để quản lý search type cho SearchClient
  const [currentSearchType, setCurrentSearchType] = useState("job");

  const { result: jobsResult, isFetching: isJobFetching } = useAppSelector(
    (state) => state.job,
  );

  const { result: companiesResult, isFetching: isCompanyFetching } =
    useAppSelector((state) => state.company);

  const isAuthenticated = useAppSelector(
    (state) => state.account.isAuthenticated,
  );
  const user = useAppSelector((state) => state.account.user) as IUser;

  useEffect(() => {
    if (isAuthenticated && user?.company) {
      navigate("/recruiter", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    const defaultJobQuery = "sorts=-updatedAt&pageSize=6";
    const defaultCompanyQuery = "sorts=-updatedAt&pageSize=6";

    dispatch(fetchJob({ query: defaultJobQuery, user }));
    dispatch(fetchCompany({ query: defaultCompanyQuery }));
  }, [dispatch]);

  if (isAuthenticated && user?.company) {
    return null;
  }

  return (
    <>
      <div style={{ width: "100%", overflow: "hidden", position: "relative" }}>
        {theme === "dark" ? (
          <VueHeroWrapper />
        ) : (
          <div
            style={{
              backgroundImage: `url(${bg})`,
              width: "100%",
              height: 520,
              position: "absolute",
              top: 5,
              backgroundRepeat: "repeat",
              zIndex: 0,
            }}
          ></div>
        )}

        <div
          className={`${styles["container"]} ${styles["home-section"]}`}
          style={{ position: "relative", zIndex: 1 }}
        >
          <div className="search-content">
            <SearchClient
              searchType={currentSearchType}
              onSearchTypeChange={setCurrentSearchType}
            />
          </div>
          <div></div>
          {!isMobile && theme === "dark" && (
            <div style={{ height: "30rem" }}></div>
          )}
          {isMobile && theme === "dark" && (
            <div style={{ height: "15rem" }}></div>
          )}
          <ManageCV />

          <Suspense fallback={<div>Loading...</div>}>
            <JobCard
              jobs={jobsResult}
              isLoading={isJobFetching}
              title={t("job.newjob")}
            />
            <Divider />
            <CompanyCard
              companies={companiesResult}
              isLoading={isCompanyFetching}
              title={t("company.newcompany")}
            />
            <Divider />
            <Introduction />
            <Banner />
            {/* <Partners /> */}
            <section>
              <Container>
                <Skill />
              </Container>
            </section>
          </Suspense>
        </div>
      </div>
    </>
  );
};

export default HomePage;
