import { invoke, router } from '@forge/bridge';
import ForgeReconciler, { Button, CheckboxGroup, Form, FormSection, Inline, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle, ModalTransition, Select, Text, Textfield } from '@forge/react';
import React, { useEffect, useState } from 'react';

const AdminPanel = () => {
  const [projects, setProjects] = useState([]);
  const [configuration, setConfiguration] = useState([]);
  const [issueTypes, setIssueTypes] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedIssueTypes, setSelectedIssueTypes] = useState([]); 
  const [isConfigurationModalOpen, setIsConfigurationModalOpen] = useState(false);
  const [selectedConfiguration, setSelectedConfiguration] = useState(null);
  const [configurationName, setConfigurationName] = useState(null);
  const [transitionIdDeny, setIdDenyButton] = useState(null);
  const [statuses, setStatuses] = useState([{statusName: '', transitionId:''}]);

  const openConfigurationModal = () => setIsConfigurationModalOpen(true);
  
  const closeConfigurationModal = () => {
    setIsConfigurationModalOpen(false)
    if(selectedConfiguration){
      setSelectedConfiguration(null);
      setConfigurationName(null);
      setSelectedProject(null);
      setSelectedIssueTypes([]);
    }
  };

  const fetchProjects = async () => {
    try {
      const result = await invoke('getProjects');
      const options = result.map(option => ({ label: option.name, value: option.id }));
      setProjects(options);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchConfiguration = async () => {
    try {
      const result = await invoke('getAppVisibility');
      const configurations = result.map(conf => ({
        id: conf.id,
        configutaionName: conf.configurationName,
        projectId: conf.projectId,
        name: conf.projectName,
        issueTypeIds: conf.issueTypeIds || [],
        denyTransitionId: conf.denyTransitionId,
        statusesConfiguration: conf.statusesConfiguration,
      }));
      setConfiguration(configurations);
    } catch (error) {
      console.error('Error fetching configurations:', error);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchConfiguration();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      const fetchIssueTypes = async () => {
        try {
          const result = await invoke('getIssueTypes', { projectId: selectedProject.value });
          const options = result.map(option => ({ label: option.name, value: option.id }));
          setIssueTypes(options);
        } catch (error) {
          console.error('Error fetching issue types:', error);
        }
      };
      fetchIssueTypes();
    }
  }, [selectedProject]);

  const handleSubmit = async () => {
    try {
      await invoke('saveConfiguration', {
        id: selectedConfiguration,
        projectId: selectedProject.value,
        projectName: selectedProject.label,
        issueTypeIds: selectedIssueTypes,
        configurationName: configurationName,
        denyTransitionId: transitionIdDeny,
        statusesConfiguration: statuses,
      });
      router.reload();
    } catch (error) {
      console.error('Error saving configuration:', error);
    }
    closeConfigurationModal();
  };

  const handleEdit = (confId) => {
    const config = configuration.find(conf => conf.id === confId);
    if (config) {
      setSelectedProject({ label: config.name, value: config.projectId });
      setSelectedIssueTypes(config.issueTypeIds);
      setSelectedConfiguration(confId);
      setConfigurationName(config.configutaionName);
      setIdDenyButton(config.denyTransitionId);
      setStatuses(config.statusesConfiguration);
      openConfigurationModal();
    }
  };

  const handleDeleteConfiguration = async (confId) =>{
    try{
        await invoke('removeConfiguration',{id:confId})
        router.reload();
    }catch{
      console.error('Error removing configuration:', error);
    }
  }

  const handleConfigutationName = (e)=> {
    setConfigurationName(e.target.value)
  }

  const handeIdDenyButton = (e)=> {
    setIdDenyButton(e.target.value);
  }

  const handleStatusChange = (index, field, value) => {
    const updatedStatuses = [...statuses];
    updatedStatuses[index][field] = value; 
    setStatuses(updatedStatuses);
  };


  return (
    <>
      <Button onClick={openConfigurationModal} appearance='primary'>Add configuration</Button>

      <Text>Configurations:</Text>
      {configuration.length > 0 ? (
        configuration.map((conf) => (
          <Inline key={conf.id} space="space.050" alignBlock="center" spread='space-between'>
            <Text>Configuration Name: {conf.configutaionName}</Text>
            <Inline space="space.050" alignBlock="center">
              <Button onClick={() => handleEdit(conf.id)}>Edit</Button>
              <Button appearance="danger" onClick={()=>{handleDeleteConfiguration(conf.id) }}> Delete </Button>
            </Inline>
          </Inline>
        ))
      ) : (
        <Text>No configurations available.</Text>
      )}

      <ModalTransition>
        {isConfigurationModalOpen && (
          <Modal onClose={closeConfigurationModal} height={500}>
            <ModalHeader>
              <ModalTitle>{selectedConfiguration ? 'Edit Configuration' : 'Add Configuration'}</ModalTitle>
            </ModalHeader>
            <ModalBody>
              <Form onSubmit={handleSubmit}>
              <FormSection>
                <Text>Configuration name:</Text>
                <Textfield  onChange={handleConfigutationName} value={configurationName}/>
              </FormSection>

                <Text>Select Project:</Text>
                <Select
                  label="Project"
                  name="selectedProject"
                  onChange={(value) => setSelectedProject(value)}
                  options={projects}
                  value={selectedProject}
                />


                <Text> Transition ID for deny button </Text>
                <Textfield onChange={handeIdDenyButton} value={transitionIdDeny}/>

                {statuses.length > 0 && statuses.map((status,i)=>(
                  <>
                  <Text>Status Name</Text>
                  <Textfield  value={status.statusName} onChange={(e) => handleStatusChange(i, 'statusName', e.target.value)} />
                  <Text>Transition ID</Text>
                 <Textfield  value={status.transitionId}  onChange={(e) => handleStatusChange(i, 'transitionId', e.target.value)} />
                  </>
                ))}
      

                {issueTypes.length > 0 && (
                  <>
                    <Text>Select Issue Types:</Text>
                    <CheckboxGroup
                      label="Issue Types"
                      name="selectedIssueTypes"
                      onChange={(value) => setSelectedIssueTypes(value)}
                      options={issueTypes}
                      value={selectedIssueTypes}
                    />
                  </>
                )}
              </Form>
            </ModalBody>
            <ModalFooter>
              <Button appearance="subtle" onClick={closeConfigurationModal}>Cancel</Button>
              <Button text="Save" onClick={()=>handleSubmit(selectedConfiguration)} appearance="primary">Save</Button>
            </ModalFooter>
          </Modal>
        )}
      </ModalTransition>
    </>
  );
};

ForgeReconciler.render(<AdminPanel />);
