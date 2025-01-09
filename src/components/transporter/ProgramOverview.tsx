const ProgramOverview = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm mb-12">
      <h2 className="text-2xl font-semibold mb-4">Program Overview</h2>
      <p className="text-gray-600 mb-4">
        Our Delivery Partner Program connects you with patients who need their medications delivered. 
        You'll have the flexibility to choose your delivery hours and areas.
      </p>
      <div className="border-t border-b py-4 my-4">
        <h3 className="text-xl font-semibold mb-2">How It Works</h3>
        <ul className="list-disc list-inside text-gray-600 space-y-2">
          <li>Accept delivery requests through our platform</li>
          <li>Deliver medications safely and on time</li>
          <li>Track your completed deliveries</li>
          <li>Get paid monthly for all completed deliveries</li>
          <li>Access to training and support resources</li>
        </ul>
      </div>
    </div>
  );
};

export default ProgramOverview;