import { callLogout } from "@/config/api";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setLogoutAction } from "@/redux/slice/accountSlide";
import { message } from "antd";
import logojobhunter from "assets/logojobhunter.png";
import enFlag from "assets/svg/language/en.svg";
import viFlag from "assets/svg/language/vi.svg";
import { useEffect, useRef, useState } from "react"; // Thêm useRef
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";
import { useTranslation } from "react-i18next";
import { FaChevronDown } from "react-icons/fa";
import { MdNightlight, MdOutlineLightMode } from "react-icons/md";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import "styles/stylespotfolio/global.scss";
import { useCurrentApp } from "../context/app.context";
import ManageAccount from "./modal/manage.account";

import avatardefault from "@/assets/avatar.svg";

// Define props type
interface HeaderProps {
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
}

// Define theme type
type ThemeContextType = "light" | "dark";

// Define types for nav items and dropdown items
interface NavItem {
  label: string | React.ReactNode;
  key: string;
  to?: string;
  isFeatured?: boolean;
  dropdownItems?: DropdownItem[];
  isNew?: boolean;
}

interface DropdownItem {
  label: string | any;
  key: string;
  to?: string;
  onClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ searchTerm, setSearchTerm }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useCurrentApp();
  const isAuthenticated = useAppSelector(
    (state) => state.account.isAuthenticated,
  );
  const user = useAppSelector((state) => state.account.user);
  const [showOffcanvas, setShowOffcanvas] = useState<boolean>(false);
  const [openManageAccount, setOpenManageAccount] = useState<boolean>(false);
  const [current, setCurrent] = useState<string>("home");
  const location = useLocation();

  // START: CÁC THAY ĐỔI ĐỂ QUẢN LÝ MENU MOBILE
  const [expanded, setExpanded] = useState<boolean>(false);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setExpanded(false); // Đóng menu khi click bên ngoài
      }
    };

    if (expanded) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [expanded]);
  // END: CÁC THAY ĐỔI

  useEffect(() => {
    setCurrent(location.pathname);
  }, [location]);

  const handleMode = (mode: ThemeContextType) => {
    localStorage.setItem("theme", mode);
    document.documentElement.setAttribute("data-bs-theme", mode);
    setTheme(mode);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogout = async () => {
    const res = await callLogout();
    if (res && res.statusCode === 200) {
      dispatch(setLogoutAction());
      message.success(t("appHeader.logoutSuccess"));
      navigate("/");
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/job?search=${encodeURIComponent(searchTerm)}`);
  };

  const renderFlag = (language: string) => (
    <img
      style={{ height: 20, width: 20 }}
      src={language === "en" ? enFlag : viFlag}
      alt={language}
    />
  );

  let navItems: NavItem[];

  if (user && user.company) {
    navItems = [
      { label: t("appHeader.recruiter"), key: "/recruiter", to: "/recruiter" },
    ];
  } else {
    navItems = [
      { label: t("appHeader.home"), key: "/", to: "/" },
      { label: t("appHeader.findjobs"), key: "/job", to: "/job", isNew: true },
      { label: t("appHeader.company"), key: "/company", to: "/company" },
      {
        label: t("appHeader.evaluateCV"),
        key: "/cv-ai",
        to: "/cv-ai",
        isNew: true,
      },
      {
        label: (
          <span>
            {t("appHeader.profileCV")}{" "}
            <FaChevronDown style={{ marginLeft: 5, fontSize: 12 }} />
          </span>
        ),
        key: "/profile-cv",
        dropdownItems: [
          {
            label: t("appHeader.onlineResume"),
            key: "/resume/create",
            to: "/resume/create",
          },
          ...(user?.company
            ? []
            : [
                {
                  label: t("appHeader.cvPage"),
                  key: "pagecv",
                  to: `/user/online-resumes/${user.id}`,
                },
              ]),
        ],
      },
    ];
  }

  const dropdownItems: DropdownItem[] = [
    {
      label: (
        <label
          style={{ cursor: "pointer" }}
          onClick={() => {
            setOpenManageAccount(true);
            setExpanded(false); // Đóng menu
          }}
        >
          {t("appHeader.manageAccount")}
        </label>
      ),
      key: "manage-account",
      onClick: () => {
        setOpenManageAccount(true);
        setExpanded(false); // Đóng menu
      },
    },
    ...(user?.role?.permissions?.length
      ? [{ label: t("appHeader.adminPage"), key: "admin", to: "/admin" }]
      : []),
    {
      label: (
        <label style={{ cursor: "pointer" }}>{t("appHeader.messages")}</label>
      ),
      key: "chat",
      to: "/chat/detail",
    },
    {
      label: (
        <label
          style={{ cursor: "pointer" }}
          onClick={() => {
            handleLogout();
            setExpanded(false); // Đóng menu
          }}
        >
          {t("appHeader.logout")}
        </label>
      ),
      key: "logout",
      onClick: () => {
        handleLogout();
        setExpanded(false); // Đóng menu
      },
    },
  ];

  return (
    <>
      <div className="header-section" ref={navRef}>
        {" "}
        {/* Gán ref vào đây */}
        <Navbar
          fixed="top"
          data-bs-theme={theme}
          expand="lg"
          className="bg-body-tertiary"
          style={{ padding: 4 }}
          expanded={expanded} // Kiểm soát trạng thái expand
          onToggle={(isExpanded) => setExpanded(isExpanded)} // Cập nhật state khi toggle
        >
          <Container>
            <Link className="navbar-brand brand" to="/">
              <img
                src={logojobhunter}
                alt="Logo Job Hunter"
                className="react-icon"
                title="SOS Nu"
              />
              &nbsp; &nbsp;
              <h3 style={{ paddingTop: 5, paddingBottom: 5 }}>
                <strong className="brand-red">{t("appHeader.brand")} </strong>
                <span className="wave" role="img" aria-labelledby="wave">
                  👋🏻
                </span>
              </h3>
            </Link>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="mx-auto">
                {navItems.map((item) =>
                  item.dropdownItems ? (
                    <NavDropdown
                      key={item.key}
                      title={item.label}
                      id={`nav-dropdown-${item.key}`}
                      className={`${current === item.key ? "active" : ""} ${
                        item.key === "/profile-cv" ? "profile-cv-dropdown" : ""
                      }`}
                    >
                      {item.dropdownItems.map((dropdownItem) =>
                        dropdownItem.to ? (
                          <NavDropdown.Item
                            key={dropdownItem.key}
                            as={Link}
                            to={dropdownItem.to}
                            onClick={() => setExpanded(false)} // Đóng menu khi click
                          >
                            {dropdownItem.label}
                          </NavDropdown.Item>
                        ) : (
                          <NavDropdown.Item
                            key={dropdownItem.key}
                            onClick={() => {
                              dropdownItem.onClick?.();
                              setExpanded(false); // Đóng menu khi click
                            }}
                          >
                            {dropdownItem.label}
                          </NavDropdown.Item>
                        ),
                      )}
                    </NavDropdown>
                  ) : (
                    <NavLink
                      key={item.key}
                      to={item.to!}
                      className={({ isActive }) =>
                        `nav-link position-relative ${
                          isActive && current === item.key ? "active" : ""
                        }`
                      }
                      onClick={() => {
                        setCurrent(item.key);
                        scrollToTop();
                        setExpanded(false); // Đóng menu khi click
                      }}
                    >
                      {item.label}
                      {item.isNew && <span className="new-badge">AI</span>}
                    </NavLink>
                  ),
                )}
              </Nav>
              <Nav className="ms-auto align-items-center">
                {isAuthenticated ? (
                  <NavDropdown
                    title={
                      <span>
                        {user?.name}{" "}
                        <img
                          src={
                            user.avatar
                              ? `${
                                  import.meta.env.VITE_BACKEND_URL
                                }/storage/avatar/${user.avatar}`
                              : avatardefault
                          }
                          alt="user avatar"
                          className="avatar"
                        />
                      </span>
                    }
                    id="user-dropdown"
                    className="user-dropdown-custom"
                  >
                    {dropdownItems.map((item) =>
                      item.to ? (
                        <NavDropdown.Item
                          key={item.key}
                          as={Link}
                          to={item.to}
                          onClick={() => setExpanded(false)} // Đóng menu
                        >
                          {item.label}
                        </NavDropdown.Item>
                      ) : (
                        <NavDropdown.Item
                          key={item.key}
                          onClick={() => {
                            item.onClick?.();
                            setExpanded(false); // Đóng menu
                          }}
                        >
                          {item.label}
                        </NavDropdown.Item>
                      ),
                    )}
                  </NavDropdown>
                ) : (
                  <>
                    <Nav.Link
                      as={Link}
                      to="/login?callback=/recruiter"
                      onClick={() => setExpanded(false)}
                    >
                      {t("appHeader.recruiter")}
                    </Nav.Link>
                    <Nav.Link
                      as={Link}
                      to="/login"
                      onClick={() => setExpanded(false)}
                    >
                      {t("appHeader.login")}
                    </Nav.Link>
                  </>
                )}
                <Nav.Link
                  onClick={() =>
                    handleMode(theme === "light" ? "dark" : "light")
                  }
                >
                  {theme === "light" ? (
                    <MdOutlineLightMode style={{ fontSize: 20 }} />
                  ) : (
                    <MdNightlight style={{ fontSize: 20 }} />
                  )}
                </Nav.Link>
                <NavDropdown
                  className="nav-item-dropdown"
                  title={renderFlag(i18n.resolvedLanguage ?? "en")}
                  id="language-dropdown"
                >
                  <NavDropdown.Item
                    onClick={() => i18n.changeLanguage("en")}
                    className="d-flex gap-2 align-items-center"
                  >
                    <img
                      style={{ height: 20, width: 20 }}
                      src={enFlag}
                      alt="english"
                    />
                    {t("appHeader.languageEn")}
                  </NavDropdown.Item>
                  <NavDropdown.Item
                    onClick={() => i18n.changeLanguage("vi")}
                    className="d-flex gap-2 align-items-center"
                  >
                    <img
                      style={{ height: 20, width: 20 }}
                      src={viFlag}
                      alt="vietnamese"
                    />
                    {t("appHeader.languageVi")}
                  </NavDropdown.Item>
                </NavDropdown>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>
      </div>
      {/* Offcanvas cho menu di động đã bị loại bỏ */}
      {/* 
      <Offcanvas
        show={showOffcanvas}
        onHide={() => setShowOffcanvas(false)}
        placement="end"
        data-bs-theme={theme}
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>{t("appHeader.offcanvasTitle")}</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Nav className="flex-column">
            {navItems.map((item) =>
              item.dropdownItems ? (
                <NavDropdown
                  key={item.key}
                  title={item.label}
                  id={`offcanvas-dropdown-${item.key}`}
                  className={current === item.key ? "active" : ""}
                >
                  {item.dropdownItems.map((dropdownItem) => (
                    <NavDropdown.Item
                      key={dropdownItem.key}
                      onClick={() => {
                        dropdownItem.onClick?.();
                        setShowOffcanvas(false);
                      }}
                    >
                      {dropdownItem.label}
                    </NavDropdown.Item>
                  ))}
                </NavDropdown>
              ) : (
                <NavLink
                  key={item.key}
                  to={item.to!}
                  className={({ isActive }) =>
                    `nav-link ${
                      isActive && current === item.key ? "active" : ""
                    }`
                  }
                  onClick={() => {
                    setCurrent(item.key);
                    setShowOffcanvas(false);
                  }}
                >
                  {item.label}
                </NavLink>
              )
            )}
            {isAuthenticated ? (
              <>
                {dropdownItems.map((item) =>
                  item.to ? (
                    <Nav.Link
                      key={item.key}
                      as={Link}
                      to={item.to}
                      onClick={() => setShowOffcanvas(false)}
                    >
                      {item.label}
                    </Nav.Link>
                  ) : (
                    <Nav.Link
                      key={item.key}
                      onClick={() => {
                        item.onClick?.();
                        setShowOffcanvas(false);
                      }}
                    >
                      {item.label}
                    </Nav.Link>
                  )
                )}
              </>
            ) : (
              <>
                <Nav.Link
                  as={Link}
                  to="/login"
                  onClick={() => setShowOffcanvas(false)}
                >
                  {t("appHeader.login")}
                </Nav.Link>
              </>
            )}
          </Nav>{" "}
        </Offcanvas.Body>
      </Offcanvas> */}

      <ManageAccount
        open={openManageAccount}
        onClose={() => setOpenManageAccount(false)}
      />
    </>
  );
};

export default Header;
