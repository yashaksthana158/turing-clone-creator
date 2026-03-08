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
    <div id="vision" className="py-5 text-center">
      <div className="container">
        <div className="section-title">Our Vision</div>
        <div className="section-subtitle mb-5 pb-3">
          Our Society's Vision is to Empower-Excel-Contribute.
        </div>

        <div className="row g-4">
          {cards.map((card) => (
            <div className="col-md-4" key={card.number}>
              <div className="card h-100">
                <div className="card-body">
                  <div className="text-primary" style={{ fontWeight: "bold" }}>
                    {card.number}
                  </div>
                  <div className="card-title mt-3">{card.title}</div>
                  <div className="mb-0 text-light">{card.description}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
