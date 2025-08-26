import { ArrowDown } from "lucide-react"; // or any arrow icon lib

function ScrollToBottomButton() {
  const scrollToEnd = () => {
    const el = document.querySelector("#chat-end");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <button
      onClick={scrollToEnd}
      className="fixed bottom-20 right-4 bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition"
    >
      <ArrowDown className="w-5 h-5" />
    </button>
  );
}

export default ScrollToBottomButton;
