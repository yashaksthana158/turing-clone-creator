export const VisionSection = () => {
  const cards = [
    {
      number: "01",
      title: "Collaborate",
      description:
        "Join our society to engage with peers and faculty members who share an interest in your field. We welcome all department students, fostering collaboration and shared growth.",
    },
    {
      number: "02",
      title: "Advance Knowledge",
      description:
        "Participate in department-led workshops, academic events, and lectures. Gain insights from experts and expand your technical and theoretical understanding through practical activities.",
    },
    {
      number: "03",
      title: "Thrive",
      description:
        "Utilize your skills in projects and research that address departmental and community challenges. Enhance your career prospects, build a strong professional network, and contribute meaningfully to your academic environment.",
    },
  ];

  return (
    <div id="vision" style={{ textAlign: "center" }}>
      <div className="container">
        <div className="section-title">Our Vision</div>
        <div className="section-subtitle">
          Our Society's Vision is to Empower-Excel-Contribute.
        </div>

        <div className="vision-grid">
          {cards.map((card) => (
            <div className="vision-card" key={card.number}>
              <div className="card-number">{card.number}</div>
              <div className="card-title">{card.title}</div>
              <div className="card-desc">{card.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
