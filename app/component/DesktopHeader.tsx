import React, { useEffect, useMemo, useState } from "react";
import { IoIosNotificationsOutline } from "react-icons/io";
import { RiMenu2Line } from "react-icons/ri";
import { IoCloseOutline } from "react-icons/io5";
import LeftSideBarMobile from "./LeftSideBarMobile";

import { useRouter } from "next/navigation";
import {
  AppNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  notificationsEventName,
} from "../services/notificationCenter";

const DesktopHeader = () => {
  const [isFlyoutFilterOpen, setFlyoutFilterOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setNotificationsOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const toggleFilterFlyout = () => setFlyoutFilterOpen(!isFlyoutFilterOpen);
  const router = useRouter();

  const refreshNotifications = () => {
    setNotifications(getNotifications());
  };

  useEffect(() => {
    refreshNotifications();
    const onCustom = () => refreshNotifications();
    const onStorage = (event: StorageEvent) => {
      if (event.key === "app_notifications_v1") refreshNotifications();
    };

    window.addEventListener(notificationsEventName, onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(notificationsEventName, onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  const handleNotificationClick = (item: AppNotification) => {
    markNotificationRead(item.id);
    refreshNotifications();
    setNotificationsOpen(false);
    if (item.route) router.push(item.route);
  };

  const markAllRead = () => {
    markAllNotificationsRead();
    refreshNotifications();
  };

  return (
    <>
      <div className=" w-full flex justify-end items-center gap-7 md:mb-14">
        <div className="w-full h-24 bg-header-gradient opacity-20 absolute top-0 left-0 right-0 "></div>
        <div className=" hidden md:w-auto md:flex md:justify-end md:items-center md:gap-7 w-auto z-10">
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotificationsOpen((prev) => !prev)}
              className="w-[50px] h-[50px] bg-white rounded-full flex justify-center items-center"
            >
              <IoIosNotificationsOutline className=" text-[#FE5C73] w-[25px] h-[25px]" />
            </button>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-3 w-3 rounded-full bg-red-500 border border-white" />
            )}
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-[24rem] max-h-[28rem] overflow-y-auto bg-white border border-[#E7E7E7] rounded-md shadow-lg z-[200]">
                <div className="px-4 py-3 border-b flex justify-between items-center">
                  <p className="font-semibold text-sm">Notifications</p>
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="text-xs text-primary-600 hover:underline"
                  >
                    Mark all read
                  </button>
                </div>
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-gray-500">No notifications yet.</div>
                ) : (
                  notifications.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNotificationClick(item)}
                      className={`block w-full text-left px-4 py-3 border-b last:border-b-0 hover:bg-[#F8FAFF] ${
                        item.read ? "bg-white" : "bg-[#F3F7FF]"
                      }`}
                    >
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-medium text-[#232323] leading-5 whitespace-normal break-words">
                          {item.title}
                        </p>
                        <p className="text-xs text-[#718EBF] leading-5 whitespace-pre-wrap break-all">
                          {item.body || "-"}
                        </p>
                        <p className="text-[11px] text-gray-400 leading-4 pt-1">
                          {new Date(item.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
        <RiMenu2Line
          onClick={toggleFilterFlyout}
          className="text-black text-xl cursor-pointer md:hidden z-20"
        />
      </div>
      {/* LEFT SIDEBAR MENU */}
      {isFlyoutFilterOpen && (
        <>
          <div
            className=" min-h-screen w-full bg-[#1f1d1d80] fixed top-0 left-0 right-0 z-[999]"
            onClick={() => {
              setFlyoutFilterOpen(!isFlyoutFilterOpen);
            }}
          ></div>
          <div
            className={`leftSideBar ${
              isFlyoutFilterOpen ? "leftSideBarOpen" : ""
            }`}
          >
            <div className=" w-full flex min-h-auto">
              {/* Flyout content here */}
              <LeftSideBarMobile />
              <IoCloseOutline
                onClick={toggleFilterFlyout}
                className=" h-8 w-8 border border-[#E7E7E7] text-[#0A0A0A] rounded cursor-pointer absolute top-[69px] right-4"
              />
            </div>
          </div>
        </>
      )}
      {/*  LEFT SIDEBAR MENU END */}
    </>
  );
};

export default DesktopHeader;
