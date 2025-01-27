// Product Features
export function ProductFeatures() {
    const features = [
      {
        title: "Ethical Production",
        description: "Fair Trade certified manufacturing process",
        icon: (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-label="Ethical Production Icon"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )
      },
      {
        title: "Sustainable Materials",
        description: "GOTS certified organic cotton blend",
        icon: (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-label="Sustainable Materials Icon"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7h3m-3 4h3m-3 4h3M6 7h6m-6 4h6m-6 4h6"
            />
          </svg>
        )
      },
      {
        title: "Quality Assurance",
        description: "Rigorous quality control standards",
        icon: (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-label="Quality Assurance Icon"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        )
      },
      {
        title: "Easy Returns",
        description: "30-day hassle-free return policy",
        icon: (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-label="Easy Returns Icon"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        )
      }
    ];
  
    return (
      <section className="bg-white rounded-2xl shadow-sm p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-8">Premium Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-start p-4 hover:bg-gray-50 rounded-xl transition-colors transform hover:scale-105"
            >
              <div className="bg-gray-100 p-3 rounded-lg mr-4 text-gray-700">
                {feature.icon}
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }
  