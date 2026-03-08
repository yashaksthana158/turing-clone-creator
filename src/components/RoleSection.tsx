export const RoleSection = () => {
  const roles = [
    {
      className: "Conference",
      title: "Conference",
      subtitle: "Seminars & Webinars",
      description:
        "Our conferences feature thought-provoking seminars and webinars that broaden students' understanding of various technological fields. These events bring together industry leaders and academic experts who share their knowledge and practical insights, creating an environment that fosters learning, professional growth, and networking opportunities. Attendees gain exposure to the latest trends and innovations while participating in discussions that inspire creativity and future career ambitions.",
      reverse: false,
    },
    {
      className: "workshop",
      title: "Workshop",
      subtitle: "Hands-on Experience",
      description:
        "Our workshops provide immersive, hands-on experiences that empower participants with practical, industry-relevant skills. From mastering coding techniques to exploring the latest advancements in technology, these sessions are designed to bridge the gap between theory and real-world application. Students benefit from guided learning that enhances their understanding and boosts their confidence, ensuring they leave with knowledge they can apply to personal projects and professional endeavors.",
      reverse: true,
    },
    {
      className: "freshers",
      title: "Community Gatherings",
      subtitle: "Welcoming New Faces & Celebrating Journeys",
      description:
        "We host vibrant community events like Freshers and Farewell to foster a strong sense of unity and celebration. Freshers' events provide a warm and inclusive welcome to new members, helping them integrate and feel connected. Meanwhile, Farewell events commemorate the achievements and journeys of graduating students, offering heartfelt recognition for their contributions and accomplishments. These gatherings create cherished memories, strengthen bonds among peers, and cultivate a supportive environment where students feel valued and inspired to contribute positively to the community.",
      reverse: false,
    },
    {
      className: "fest",
      title: "Overload++",
      subtitle: "Challenge & Innovate",
      description:
        "Overload++ is an exhilarating event that pushes students to the limits of their critical thinking and problem-solving abilities. Participants work in teams to tackle intricate challenges, often under time constraints, fostering a collaborative spirit and enhancing their ability to think on their feet. This event not only tests resilience and adaptability but also encourages participants to innovate and develop creative solutions. The experience gained helps them build confidence, teamwork, and leadership skills that are invaluable in both academic and professional settings.",
      reverse: true,
    },
  ];

  return (
    <section id="combined-section" className="combined">
      <div className="combined-heading">
        <h1 className="text-light">
          <span className="red">What</span>&nbsp;role do we play?
        </h1>
      </div>

      <div className="sections">
        {roles.map((role, index) => (
          <div
            key={index}
            className={`boxes ${role.reverse ? "reverse-layout" : ""}`}
          >
            {role.reverse ? (
              <>
                <div className={`event-img ${role.className}`}></div>
                <div className="event-name">
                  <h6 className="event-title red">{role.title}</h6>
                  <h6 className="event-subtitle">{role.subtitle}</h6>
                  <p>{role.description}</p>
                </div>
              </>
            ) : (
              <>
                <div className="event-name">
                  <h6 className="event-title red">{role.title}</h6>
                  <h6 className="event-subtitle">{role.subtitle}</h6>
                  <p>{role.description}</p>
                </div>
                <div className={`event-img ${role.className}`}></div>
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
