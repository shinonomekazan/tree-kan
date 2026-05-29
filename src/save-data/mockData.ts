import type { TreeNode } from "../types";

export const projectData: TreeNode = {
  id: "root",
  name: "SHINONOMEKAZAN",
  type: "root",
  children: [
    {
      id: "p1",
      name: "Mobile App",
      type: "project",
      color: "#3b82f6",
      children: [
        {
          id: "m1",
          name: "Auth Module",
          type: "module",
          children: [
            {
              id: "t1",
              name: "UI Login",
              type: "task",
              status: "done",
              order: 0,
              assignee: "Dev A",
              description: "Thiết kế giao diện màn hình đăng nhập.",
            },
            {
              id: "t2",
              name: "API Login",
              type: "task",
              status: "in-progress",
              order: 1,
              assignee: "Dev B",
              description: "Tích hợp API xác thực người dùng.",
            },
            {
              id: "t8",
              name: "Token Security",
              type: "task",
              status: "review",
              order: 2,
              assignee: "Dev C",
              description: "Review logic bảo mật token.",
            },
          ],
        },
        {
          id: "m2",
          name: "Profile Module",
          type: "module",
          children: [
            {
              id: "t3",
              name: "Upload Avatar",
              type: "task",
              status: "archive",
              order: 0,
              assignee: "Dev C",
              description: "Tính năng đã được lưu trữ.",
            },
            {
              id: "t4",
              name: "Update Info",
              type: "task",
              status: "todo",
              order: 1,
              assignee: "Dev A",
              description: "Form cập nhật thông tin cá nhân.",
            },
          ],
        },
      ],
    },
    {
      id: "p2",
      name: "Web Portal",
      type: "project",
      color: "#f97316",
      children: [
        {
          id: "m3",
          name: "Dashboard",
          type: "module",
          children: [
            {
              id: "t5",
              name: "Chart Component",
              type: "task",
              status: "done",
              order: 0,
              assignee: "Dev D",
            },
            {
              id: "t6",
              name: "Export PDF",
              type: "task",
              status: "in-progress",
              order: 1,
              assignee: "Dev D",
            },
          ],
        },
        {
          id: "m4",
          name: "Settings",
          type: "module",
          children: [
            {
              id: "t7",
              name: "Role Config",
              type: "task",
              status: "todo",
              order: 0,
              assignee: "Dev E",
            },
          ],
        },
      ],
    },
  ],
};
