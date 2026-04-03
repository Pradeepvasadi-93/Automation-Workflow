import React from "react";

const Paidplan = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center py-12 px-6">
      {/* Header */}
      <h1 className="text-2xl font-semibold mb-2">Select your plan</h1>
      <p className="text-gray-400 mb-8 text-center max-w-xl">
        Upgrade for a broader search experience and premium AI models.
      </p>

      {/* Plans */}
      <div className="grid md:grid-cols-2 gap-8 w-full max-w-5xl">
        {/* Pro Plan */}
        <div className="bg-[#1a1a1f] rounded-lg shadow-lg p-6 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold">Pro</h2>
            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">
              Popular
            </span>
          </div>
          <p className="text-gray-300 mb-2">
            Advanced answers and top AI models
          </p>
          <p className="text-2xl font-bold mb-4">
            $17 <span className="text-base font-normal">/month</span>
            <span className="text-gray-400 text-sm"> when billed annually</span>
          </p>

          <ul className="text-gray-300 space-y-2 mb-6 text-sm">
            <li>• Automate complex tasks with access to Computer</li>
            <li>• Access to the latest AI models, post-trained for higher accuracy</li>
            <li>• Select between Gemini 3.1 Pro, Sonar, Claude Sonnet 4.6, and more</li>
            <li>• Better for complex questions and building reports, documents, and apps</li>
            <li>• Deeper sourcing from Perplexity’s index, including proprietary financial and scientific data</li>
            <li>• Usage limits best for most users</li>
          </ul>

          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md py-2">
            Get Pro
          </button>
        </div>

        {/* Max Plan */}
        <div className="bg-[#1a1a1f] rounded-lg shadow-lg p-6 flex flex-col">
          <h2 className="text-xl font-semibold mb-2">Max</h2>
          <p className="text-gray-300 mb-2">
            Highest usage and top performance
          </p>
          <p className="text-2xl font-bold mb-4">
            $167 <span className="text-base font-normal">/month</span>
            <span className="text-gray-400 text-sm"> when billed annually</span>
          </p>

          <ul className="text-gray-300 space-y-2 mb-6 text-sm">
            <li>• Automate complex tasks with 10,000 monthly and 35,000 bonus credits</li>
            <li>• Get the best answers with the most advanced AI reasoning models</li>
            <li>• Run deep investigations at any scale</li>
            <li>• Work with massive datasets and files</li>
            <li>• Compare responses across multiple AI models with Perplexity Model Council</li>
            <li>• Priority access to new features</li>
          </ul>

          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md py-2">
            Get Max
          </button>
        </div>
      </div>
    </div>
  );
};

export default Paidplan;