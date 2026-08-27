import UploadPage from "@/pages/UploadPage";
import {
  AssessmentProvider,
} from "@/context/AssessmentContext";

function App() {
  return (
    <AssessmentProvider>
      <div className="min-h-screen w-full min-w-0 overflow-x-hidden">
        <UploadPage />
      </div>
    </AssessmentProvider>
  );
}

export default App;