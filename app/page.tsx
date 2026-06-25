import SwipeDeck from "@/components/SwipeDeck";

export default function Home() {
  return (
    <>
      <p className="text-center text-sm text-white/60 mb-1">
        Swipe right to <span className="text-like font-semibold">keep</span>,
        left to <span className="text-flame font-semibold">pass</span>.
        <br />
        Help pick the best 25 fonts for the embroidery designer.
      </p>
      <SwipeDeck />
    </>
  );
}
