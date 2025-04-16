type FeedbackSectionProps = {
  title: string;
  children: React.ReactNode;
};

export function FeedbackSection({ title, children }: FeedbackSectionProps) {
  return (
    <div className="mb-8">
      <h3 className="mb-3 text-xl font-semibold text-gray-900">{title}</h3>
      <div className="text-gray-700">{children}</div>
    </div>
  );
}
