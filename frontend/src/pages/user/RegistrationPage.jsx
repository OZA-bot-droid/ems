
import { useState } from "react";

const initialRegistrations = [
  {
    id: 1,
    eventName: "클라우드 네이티브 컨퍼런스",
    status: "APPROVED",
  },
  {
    id: 2,
    eventName: "실시간 웹 기술 세미나",
    status: "PENDING",
  },
  {
    id: 3,
    eventName: "마이크로서비스 실습 워크숍",
    status: "REJECTED",
  },
  {
    id: 4,
    eventName: "개발자 커뮤니티 밋업",
    status: "CANCELLED",
  },
];

function RegistrationPage() {
  const [registrations, setRegistrations] = useState(
    initialRegistrations
  );
  const [filter, setFilter] = useState("ALL");

  const filteredRegistrations =
    filter === "ALL"
      ? registrations
      : registrations.filter(
          (registration) => registration.status === filter
        );

  const cancelRegistration = (id) => {
    const confirmed = window.confirm("참가 신청을 취소할까요?");

    if (!confirmed) return;

    setRegistrations((prev) =>
      prev.map((registration) =>
        registration.id === id &&
        (registration.status === "PENDING" ||
          registration.status === "APPROVED")
          ? { ...registration, status: "CANCELLED" }
          : registration
      )
    );
  };

  return (
    <main>
      <h1>참가 신청 및 내역</h1>
      <p>신청 · 취소 · 승인 상태 확인</p>

      <section>
        <h2>나의 참가 신청</h2>

        <button onClick={() => setFilter("ALL")}>
          전체
        </button>

        <button onClick={() => setFilter("PENDING")}>
          승인 대기
        </button>

        <ul>
          {filteredRegistrations.map((registration) => (
            <li key={registration.id}>
              <strong>{registration.eventName}</strong>
              {" · "}
              {registration.status}
              {" · "}

              {registration.status === "PENDING" ||
              registration.status === "APPROVED" ? (
                <button
                  onClick={() =>
                    cancelRegistration(registration.id)
                  }
                >
                  신청 취소
                </button>
              ) : (
                <button
                  onClick={() =>
                    alert(
                      `${registration.eventName}\n상태: ${registration.status}`
                    )
                  }
                >
                  상세 보기
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <p>
        중복 신청 및 타인의 참가 신청 변경은 서버에서 차단됩니다.
      </p>
    </main>
  );
}

export default RegistrationPage;
