import MyOrdersClient from "./MyOrdersClient";

export const metadata = {
  title: "My Orders - The Twisted Threads",
  description: "View your past orders",
};

export default function MyOrdersPage() {
  return <MyOrdersClient />;
}
