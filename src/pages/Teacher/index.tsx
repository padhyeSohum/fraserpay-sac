
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import TeacherLanding from './Landing';
import TeacherAuth from './TeacherAuth';
import CreateBooth from './CreateBooth';
import BoothSuccess from './BoothSuccess';
import ExistingBooths from './ExistingBooths';

const TeacherRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<TeacherLanding />} />
      <Route path="/create" element={<TeacherAuth />} />
      <Route path="/create-booth" element={<CreateBooth />} />
      <Route path="/success" element={<BoothSuccess />} />
      <Route path="/booths" element={<ExistingBooths />} />
      <Route path="*" element={<Navigate to="/teacher" replace />} />
    </Routes>
  );
};

export default TeacherRoutes;
