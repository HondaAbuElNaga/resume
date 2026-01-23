"use client";

import { useState, FormEvent } from "react";

interface PromptFormProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
}

/**
 * Prompt form component for entering resume generation prompt.
 * 
 * Provides a textarea for the user to describe their background
 * and a submit button to generate the resume.
 */
export default function PromptForm({ onSubmit, isLoading }: PromptFormProps) {
  const [prompt, setPrompt] = useState("");

  /**
   * Handle form submission.
   * Prevents default form behavior and calls the onSubmit callback.
   */
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Only submit if prompt is not empty
    if (prompt.trim()) {
      onSubmit(prompt.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
          Describe your background
        </label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., I'm a machine learning engineer with 3 years of experience at Google and Microsoft. I have a Master's degree in Computer Science and specialize in Python, TensorFlow, and deep learning."
          rows={8}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          disabled={isLoading}
          required
        />
        <p className="mt-2 text-sm text-gray-500">
          Be as detailed as possible. Include your job titles, companies, education, and skills.
        </p>
      </div>

      <button
        type="submit"
        disabled={isLoading || !prompt.trim()}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {isLoading && (
          <svg
            className="animate-spin h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {isLoading ? "Generating resume..." : "Generate Resume"}
      </button>
    </form>
  );
}

