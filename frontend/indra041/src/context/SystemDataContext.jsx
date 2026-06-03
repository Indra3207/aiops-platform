import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { SYSTEMS as MockSystems, SYSTEM_DIAGNOSIS as MockSystemDiagnosis, USER_SYSTEM as MockUserSystem, ASSIGNMENTS as MockAssignments } from '../data/mockData';

const SystemDataContext = createContext(null);

export function useSystemData() {
  const context = useContext(SystemDataContext);
  if (!context) {
    throw new Error('useSystemData must be used within a SystemDataProvider');
  }
  return context;
}

export function SystemDataProvider({ children }) {
  const { messages, isConnected } = useWebSocket();
  const [systemsMap, setSystemsMap] = useState(new Map());
  const [isUsingMockData, setIsUsingMockData] = useState(true);

  // Unified Global Workflow State
  const [globalWorkflowState, setGlobalWorkflowState] = useState({});
  const [userNotifications, setUserNotifications] = useState([]);

  // Fallback API call if WS fails initially
  const fetchInitialData = useCallback(async () => {
    try {
      const response = await fetch(process.env.REACT_APP_API_URL + '/api/systems');
      if (response.ok) {
        const data = await response.json();
        if (data.systems && data.systems.length > 0) {
          const newMap = new Map();
          data.systems.forEach(sys => {
             const id = sys.system_info?.system_id;
             if (id) newMap.set(id, sys);
          });
          setSystemsMap(newMap);
          setIsUsingMockData(false);
        }
      }
    } catch (error) {
      console.log("No live API data available, using mock data.");
      setIsUsingMockData(true);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Process incoming WebSocket messages
  useEffect(() => {
    if (messages.length > 0) {
      const latestMsg = messages[messages.length - 1];
      
      if (latestMsg.type === 'catch_up' && latestMsg.systems) {
         const newMap = new Map(systemsMap);
         latestMsg.systems.forEach(sys => {
             const id = sys.system_info?.system_id;
             if (id) newMap.set(id, sys);
         });
         setSystemsMap(newMap);
         setIsUsingMockData(false);
      }
      else if (latestMsg.type === 'analysis_update' && latestMsg.data) {
        const payload = latestMsg.data;
        const systemId = payload.system_info?.system_id;
        
        if (systemId) {
          setSystemsMap(prev => {
            const newMap = new Map(prev);
            newMap.set(systemId, payload);
            return newMap;
          });
          setIsUsingMockData(false);
        }
      }
    }
  }, [messages]);

  // =========================================================
  // UNIFIED WORKFLOW METHODS
  // =========================================================

  const assignToTechnician = useCallback((systemId) => {
    setGlobalWorkflowState(prev => ({
      ...prev,
      [systemId]: { ...prev[systemId], assignedToTech: true, status: "in-progress" }
    }));
  }, []);

  const escalateToAdmin = useCallback((systemId, verdictDetails) => {
    setGlobalWorkflowState(prev => ({
      ...prev,
      [systemId]: { 
        ...prev[systemId], 
        techVerdict: verdictDetails, 
        escalatedToAdmin: true 
      }
    }));
  }, []);

  const approveAdminDecision = useCallback((systemId) => {
    setGlobalWorkflowState(prev => ({
      ...prev,
      [systemId]: { ...prev[systemId], adminDecision: "approved" }
    }));
  }, []);

  const rejectAdminDecision = useCallback((systemId) => {
    setGlobalWorkflowState(prev => ({
      ...prev,
      [systemId]: { ...prev[systemId], adminDecision: "rejected" }
    }));
  }, []);

  const deferAdminDecision = useCallback((systemId) => {
    setGlobalWorkflowState(prev => ({
      ...prev,
      [systemId]: { ...prev[systemId], adminDecision: "deferred" }
    }));
  }, []);

  const updateInvestigation = useCallback((systemId, payload) => {
    setGlobalWorkflowState(prev => ({
      ...prev,
      [systemId]: { ...prev[systemId], investigationData: { ...prev[systemId]?.investigationData, ...payload } }
    }));
  }, []);

  const requestSupport = useCallback((systemId) => {
    setUserNotifications(prev => [{
      id: Date.now(),
      title: "Support Ticket Created",
      message: `Support request for ${systemId} logged successfully.`,
      timestamp: "Just now",
      icon: "💬"
    }, ...prev]);
  }, []);

  // Helper methods to get formatted data
  
  // Get all systems for Admin Dashboard
  const getAllSystems = useCallback(() => {
    if (isUsingMockData || systemsMap.size === 0) {
      return MockSystems;
    }
    
    return Array.from(systemsMap.values()).map(sys => ({
      id: sys.system_info.system_id,
      owner: sys.system_info.owner || "Unknown",
      status: sys.system_info.overall_status,
      healthScore: sys.system_info.health_score,
      primaryRootCause: sys.diagnosis?.root_cause || "Pending AI Analysis",
      // Map live data to the UI format needed by the Admin detail page
      liveData: sys
    }));
  }, [isUsingMockData, systemsMap]);


  // Get detailed diagnosis for Technician view
  const getSystemDiagnosis = useCallback((systemId) => {
    if (isUsingMockData || !systemsMap.has(systemId)) {
      // Mock fallback
      if (systemId === "SYS-1049") return MockSystemDiagnosis; 
      
      // Adapt a generic mock for other IDs
      return {
          ...MockSystemDiagnosis,
          systemInfo: { ...MockSystemDiagnosis.systemInfo, systemId }
      };
    }

    const liveData = systemsMap.get(systemId);
    
    // Map live JSON schema to the React props schema expected by SystemDiagnosis.jsx
    return {
      systemInfo: {
        systemId: liveData.system_info.system_id,
        owner: liveData.system_info.owner,
        os: liveData.system_info.system_type,
        assignedTechnician: liveData.system_info.assigned_technician,
        slaHours: liveData.system_info.sla_hours
      },
      aiDiagnosis: {
        severity: liveData.system_info.severity,
        rootCause: liveData.diagnosis.root_cause,
        confidence: liveData.diagnosis.confidence / 100, // Frontend expects decimal e.g. 0.95
        predictedWindow: liveData.diagnosis.predicted_window || "Generating...",
        technicalExplanation: liveData.explanations?.technical || "AI analysis is currently processing this diagnosis.",
      },
      signals: liveData.signals?.signal_cards || [],
      timeline: liveData.timeline || [],
      // Add status to let components know if it's still loading the AI portion
      ai_status: liveData.ai_status || "ready"
    };
  }, [isUsingMockData, systemsMap]);


  // Get user perspective data
  const getUserSystemDetail = useCallback((systemId) => {
      if (isUsingMockData || !systemsMap.has(systemId)) {
          return MockUserSystem;
      }
      
      const liveData = systemsMap.get(systemId);
      
        const sysStatus = globalWorkflowState[systemId]?.adminDecision === "approved" 
          ? "approved" 
          : liveData.system_info.overall_status;
          
      return {
          systemName: `${liveData.system_info.owner}'s System`,
          systemId: liveData.system_info.system_id,
          overallStatus: sysStatus,
          explanation: {
              what: sysStatus === "approved" ? "Hardware replacement has been approved!" : (liveData.explanations?.user_friendly?.what || "Evaluating system health..."),
              why: sysStatus === "approved" ? "A technician will contact you shortly to swap the hardware." : (liveData.explanations?.user_friendly?.why || "We are checking system performance metrics."),
              hardwareFault: liveData.explanations?.user_friendly?.hardware_fault || "Diagnosing physical components..."
          },
          statuses: {
              hardware: { state: liveData.signals?.hardware_state || "attention", message: liveData.explanations?.admin_assessments?.hardware || "Evaluating..." },
              software: { state: liveData.signals?.software_state || "attention", message: liveData.explanations?.admin_assessments?.software || "Evaluating..." },
              security: { state: liveData.signals?.security_state || "good", message: liveData.explanations?.admin_assessments?.security || "Evaluating..." }
          },
          actions: liveData.user_actions || [{ id: 1, icon: "⏳", text: "Please wait while AI generates recommendations." }]
      };
      
  }, [isUsingMockData, systemsMap]);


  // Get Assigned Systems for technician
  const getAssignedSystems = useCallback(() => {
     if (isUsingMockData || systemsMap.size === 0) {
         return MockAssignments;
     }
     
     // Only return systems that need attention (simulate assigned queue)
     return Array.from(systemsMap.values())
        .filter(sys => sys.system_info.overall_status !== "healthy")
        .map(sys => ({
            id: sys.system_info.system_id,
            owner: sys.system_info.owner,
            severity: sys.system_info.severity,
            status: "pending", 
            aiRootCause: sys.diagnosis?.root_cause || "Pending AI analysis",
            slaHours: sys.system_info.sla_hours
        }));
  }, [isUsingMockData, systemsMap]);

  return (
    <SystemDataContext.Provider
      value={{
        isConnected,
        isUsingMockData,
        systemsMap,
        getAllSystems,
        getSystemDiagnosis,
        getUserSystemDetail,
        getAssignedSystems,
        globalWorkflowState,
        assignToTechnician,
        escalateToAdmin,
        approveAdminDecision,
        rejectAdminDecision,
        deferAdminDecision,
        updateInvestigation,
        userNotifications,
        requestSupport
      }}
    >
      {children}
    </SystemDataContext.Provider>
  );
}
