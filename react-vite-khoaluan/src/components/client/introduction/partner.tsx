// import { callFetchCompany } from "@/config/api";
// import { convertSlug, getLocationName } from "@/config/utils";
// import { ICompany } from "@/types/backend";
// import { Col, Row } from "react-bootstrap";
// import { useState, useEffect } from "react";
// import { isMobile } from "react-device-detect";
// import { Link } from "react-router-dom";
// import styles from "styles/client.module.scss";
// import SimpleGlowCard from "components/share/glowcard/simple.glow-card";
// import { useCurrentApp } from "components/context/app.context";
//
// const Partners = () => {
//   const { theme } = useCurrentApp();
//   const [partners, setPartners] = useState<ICompany[] | null>(null);
//   const [isLoading, setIsLoading] = useState<boolean>(false);
//
//   useEffect(() => {
//     fetchPartners();
//   }, []);
//
//   const fetchPartners = async () => {
//     setIsLoading(true);
//     const res = await callFetchCompany("page=1&size=4&sort=updatedAt,desc");
//     if (res && res.data) {
//       setPartners(res.data.result);
//     }
//     setIsLoading(false);
//   };
//
//   return (
//     <div
//       className={`${styles["partners-section"]}`}
//       style={{ marginBottom: "2rem" }}
//     >
//       <div className={`${styles["partners-content"]}`}>
//         <h2
//           className={styles["title"]}
//           style={{
//             fontSize: isMobile ? "1.5rem" : "2rem",
//             marginBottom: "1.5rem",
//             textAlign: "center",
//             color: theme === "dark" ? "#fff" : "#000",
//           }}
//         >
//           Đối Tác Hàng Đầu
//         </h2>
//         {isLoading ? (
//           <div className="text-center py-4">
//             <div className="spinner-border" role="status">
//               <span className="visually-hidden">Loading...</span>
//             </div>
//           </div>
//         ) : (
//           <Row className="g-4">
//             {partners?.map((item) => (
//               <Col xs={12} md={3} key={item.id}>
//                 <Link
//                   to={`/company/${convertSlug(item?.name!)}?id=${item.id}`}
//                   style={{ textDecoration: "none" }}
//                 >
//                   <SimpleGlowCard identifier={`partner-${item.id}`}>
//                     <div className="p-2 text-center">
//                       <img
//                         alt="partner logo"
//                         src={`${import.meta.env.VITE_BACKEND_URL}/storage/company/${item?.logo}`}
//                         style={{
//                           width: "80px",
//                           height: "80px",
//                           objectFit: "cover",
//                           borderRadius: "10px",
//                           marginBottom: "0.5rem",
//                         }}
//                       />
//                       <p
//                         style={{
//                           color: theme === "dark" ? "#ccc" : "#666",
//                           fontSize: "0.875rem",
//                           fontWeight: 500,
//                           marginBottom: "0.5rem",
//                         }}
//                       >
//                         {item.name}
//                       </p>
//                       <p
//                         style={{
//                           color: theme === "dark" ? "#58aaab" : "#000",
//                           fontSize: "0.75rem",
//                         }}
//                       >
//                         {getLocationName(item?.location!)}
//                       </p>
//                     </div>
//                   </SimpleGlowCard>
//                 </Link>
//               </Col>
//             ))}
//             {(!partners || partners.length === 0) && (
//               <Col xs={12} className="text-center">
//                 <p>Không có dữ liệu</p>
//               </Col>
//             )}
//           </Row>
//         )}
//       </div>
//     </div>
//   );
// };
//
// export default Partners;
