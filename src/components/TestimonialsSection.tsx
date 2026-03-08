export const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "Nilesh Pandey",
      role: "Student",
      content:
        "No issues on the speakers. All had thought well. Session time can be extended. By extending the time it will be useful for us. We can gain more knowledge.",
    },
    {
      name: "Shahnawaz Khan",
      role: "Student",
      content:
        "The session was very informative and interactive. Very useful. It is a great initiative and we hope to attend many more of such sessions.",
    },
    {
      name: "Uttkarsh Shekhar",
      role: "Student",
      content:
        "The seminar was insightful and well-structured, making technical concepts easy to understand. The hands-on session on NLP was particularly helpful in my project. It would be great to have more such workshops to explore different topics in depth.",
    },
  ];

  return (
    <div id="testimonial" className="py-5 text-center">
      <div className="container">
        <div className="section-title">Testimonials</div>
        <div className="section-subtitle mb-5 pb-3">What Our Members Say</div>
        <div className="row g-4">
          {testimonials.map((testimonial, index) => (
            <div className="col-md-4" key={index}>
              <div className="card h-100">
                <div className="card-body">
                  <h6 className="mt-1 text-light">{testimonial.name}</h6>
                  <small className="text-warning">{testimonial.role}</small>
                  <p className="mt-3">{testimonial.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
