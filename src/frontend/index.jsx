import ForgeReconciler, { Button, Text } from '@forge/react';
import { view, invoke, router } from '@forge/bridge';
import React, { useEffect, useState } from 'react';

const App = () => {
  const [issueKey, setIssueKey] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkVisibility = async (issueContext) => {
      try {
        const { projectId, issueTypeId } = issueContext;
        const visibilityResult = await invoke('getAppVisibility', {
          projectId,
          issueTypeId,
        });

       const appConfiguration = await visibilityResult.filter(p=>p.projectId===projectId).flat();

       if(appConfiguration.length>0){
        const projectConf = await appConfiguration.filter(conf=>conf.issueTypeIds.includes(issueTypeId));
        if(projectConf.length > 0){
          setIsVisible(true)
        }
       }else{
        setIsVisible(false);
       }

      } catch (error) {
        console.error('Wystąpił błąd podczas sprawdzania widoczności:', error);
        setIsVisible(false);
      }
    };

    view.getContext().then(async (context) => {
      const issueKey = context?.extension?.issue?.key;
      setIssueKey(issueKey);

      const projectId = context?.extension?.project?.id;
      const issueTypeId = context?.extension?.issue?.typeId;

      checkVisibility({ projectId, issueTypeId });
    });
  }, []);

  const handleTransition = async (transitionId) => {

    if (!issueKey) {
      console.error('Nie można wykonać tranzycji bez klucza issue.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await invoke('executeTransition', { issueKey, transitionId });

      if (result.error) {
        console.error('Błąd z serwera:', result.error);
      } else {
        console.log(result.message);
      }
    } catch (error) {
      console.error('Wystąpił błąd podczas wywoływania resolvera:', error);
    } finally {
      setIsLoading(false);
      router.reload();
    }
  };

  if (!isVisible) {
    return <Text>Aplikacja nie jest dostępna dla tego zgłoszenia.</Text>;
  }

  return (
    <>
      <Button
        appearance="primary"
        onClick={() => handleTransition('61')} 
        isLoading={isLoading}
      >
        Approve
      </Button>

      <Button
        appearance="danger"
        onClick={() => handleTransition('11')} 
        isLoading={isLoading}
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
