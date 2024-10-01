import ForgeReconciler, { Button, Text } from '@forge/react';
import { view, invoke, router } from '@forge/bridge';
import React, { useEffect, useState } from 'react';

const App = () => {
  const [issueKey, setIssueKey] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [denyTransitionId, setDenyTransitionId] = useState(null);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [approveLoading, setApproveLoading] = useState(false);
  const [denyLoading, setDenyLoading] = useState(false);
  const [statusConfiguration, setStatusConfiguration] = useState(null);
  const [transitionIdForCurrentStatus, setTransitionIdForCurrentStatus] = useState(null);


  const getCurrentIssueStatus = async (issueKey) =>{
    const status = await invoke('getIssueDetails', {issueKey});
    setCurrentStatus(status)
  }

  useEffect(()=>{
    if(currentStatus){
    const transitionIdForCurrentStatus = statusConfiguration.filter(stat=>stat.statusName==currentStatus.name)
    if(transitionIdForCurrentStatus.length > 0){
      setTransitionIdForCurrentStatus(transitionIdForCurrentStatus[0].transitionId)

    }
  }
  },[currentStatus])


  useEffect(() => {
    const checkVisibility = async (issueContext) => {
      try {
        const { projectId, issueTypeId } = issueContext;
        const visibilityResult = await invoke('getAppVisibility', { projectId, issueTypeId,  });
        const appConfiguration = await visibilityResult.filter(p => p.projectId === projectId).flat();
        if (appConfiguration.length > 0) {
          const projectConf = appConfiguration.find(conf => conf.issueTypeIds.includes(issueTypeId));
          const statusesConfigurationArray = appConfiguration.map(item => item.statusesConfiguration).flat();
          setStatusConfiguration(statusesConfigurationArray)

          if (projectConf) {
            setIsVisible(true); 
            setDenyTransitionId(projectConf.denyTransitionId);
          }
        } else {
          setIsVisible(false);
        }
      } catch (error) {
        console.error('Error checking visibility:', error);
        setIsVisible(false);
      }
    };

    const fetchIssueContext = async () => {
      const context = await view.getContext();
      const issueKey = context?.extension?.issue?.key;
      setIssueKey(issueKey);
      
      const projectId = context?.extension?.project?.id;
      const issueTypeId = context?.extension?.issue?.typeId;

      await checkVisibility({ projectId, issueTypeId });
    };

    fetchIssueContext();
  }, []);


    useEffect(()=>{
      if(issueKey){
        getCurrentIssueStatus(issueKey);
      }
    },[issueKey])

  const handleTransition = async (identifier) => {
    if (!issueKey) {
      console.error('Cannot perform transition without issue key.');
      return;
    }

    if (identifier === 'deny') {
      setDenyLoading(true);
    } else {
      setApproveLoading(true);
    }

    try {
      if (identifier === 'deny') {
        await invoke('executeTransition', { issueKey, transitionId: denyTransitionId });
      } else {
        await invoke('executeTransition', { issueKey, transitionId: '61' });
      }
    } catch (error) {
      console.error('Error executing transition:', error);
    } finally {
      setApproveLoading(false);
      setDenyLoading(false);
      router.reload();
    }
  };

  if (!isVisible || !transitionIdForCurrentStatus) {
    return <Text>Application is not available for this issue.</Text>;
  }

  return (
    <>
      <Button
        appearance="primary"
        onClick={() => handleTransition('approve')}
        isLoading={approveLoading}
      >
        Approve
      </Button>

      <Button
        appearance="danger"
        onClick={() => handleTransition('deny')}
        isLoading={denyLoading}
      >
        Deny
      </Button>
    </>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
