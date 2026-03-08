export const RegistrationsSection = () => {
  const events = [
    {
      image: "/img/program_details/4.webp",
      link: "/coderush",
      label: "View results",
    },
    {
      image: "/img/program_details/3.webp",
      link: "/techwar",
      label: "View results",
    },
    {
      image: "/img/program_details/2.webp",
      link: "/hackzzle",
      label: "View results",
    },
  ];

  return (
    <section className="upcoming-events">
      <h2>
        <span className="red">Live</span>&nbsp;Registrations
      </h2>
      <div className="container">
        <div className="events-grid">
          {events.map((event, index) => (
            <div key={index}>
              <div className="upcoming-event-card">
                <div
                  className="upcoming-event-img"
                  style={{
                    backgroundImage: `url('${event.image}')`,
                  }}
                ></div>
                <a href={event.link} className="btn-custom">
                  {event.label}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
