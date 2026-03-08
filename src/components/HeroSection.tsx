export const HeroSection = () => {
  return (
    <div className="slider_area">
      <div
        className="single_slider"
        style={{
          background: "url(/img/index_banner2.jpeg) no-repeat center center fixed",
          backgroundSize: "cover",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div className="container">
          <div className="row" style={{ alignItems: "center", justifyContent: "center", textAlign: "center" }}>
            <div style={{ width: "100%" }}>
              <div className="slider_text" style={{ color: "#fff", padding: "12px", marginTop: "3rem" }}>
                <h1
                  style={{
                    fontFamily: "'Oxanium'",
                    fontSize: "8vw",
                    color: "#fff",
                    fontWeight: "bold",
                  }}
                >
                  TURING SOCIETY
                </h1>
                <h2
                  style={{
                    fontFamily: "'Oxanium'",
                    fontSize: "4vw",
                    color: "#fff",
                    fontWeight: 500,
                  }}
                >
                  DEPARTMENT OF COMPUTER SCIENCE
                </h2>
                <h2
                  style={{
                    fontFamily: "'Oxanium'",
                    fontSize: "3vw",
                    color: "#ffc107",
                    textTransform: "uppercase",
                    fontWeight: 500,
                  }}
                >
                  Acharya Narendra Dev College
                </h2>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
