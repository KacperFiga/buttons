import Resolver from '@forge/resolver';
import { v4 as uuidv4 } from 'uuid';

import api, { route, storage } from '@forge/api'; 

const resolver = new Resolver();

resolver.define('saveConfiguration', async (req) => {
  const uniqueId = uuidv4();
  const { id, projectId, issueTypeIds, projectName, configurationName, denyTransitionId, statusesConfiguration } = req.payload;

  try {
    const currentConfig = await storage.get('appConfiguration') || [];
    if(id){
      const configIndex = currentConfig.findIndex(config => config.id === id);
      if (configIndex !== -1) {
        currentConfig[configIndex] = { id, projectId, issueTypeIds, projectName, configurationName, denyTransitionId, statusesConfiguration};
        await storage.set('appConfiguration', currentConfig);
      }
    }else{
      const updatedConfig = [...currentConfig, { id: uniqueId, projectId, issueTypeIds, projectName, configurationName, denyTransitionId: denyTransitionId, statusesConfiguration }];
      await storage.set('appConfiguration', updatedConfig);
  
      return { message:'Configuration saved' };
    }
  
  } catch (error) {
    console.error('Unable to save configuration:', error);
    return { error: 'Unable to save configuration' };
  }
});


resolver.define('getAppVisibility', async () => {
  try {
    const config = await storage.get('appConfiguration');
    return config ? config : { message: 'No saved configuration' };
  } catch (error) {
    console.error('Error while fetching visibility configuration:', error);
    return { error: error.message };
  }
});


resolver.define('removeConfiguration', async (req) => {
  const { id } = req.payload;

  try {
    const currentConfig = await storage.get('appConfiguration') || [];
    const updatedConfig = currentConfig.filter(config => config.id !== id);
    await storage.set('appConfiguration', updatedConfig);
    return { message: `Configuration has been removed.` };
  } catch (error) {
    console.error('Error while removing configuration:', error);
    return { error: 'Unable to remove configuration.' };
  }
});


resolver.define('executeTransition', async (req) => {
  const { issueKey, transitionId } = req.payload;

  try {
    const response = await api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}/transitions`, {
      method: 'GET',
    });

    const data = await response.json();
    const availableTransitions = data.transitions;

    const isTransitionAvailable = availableTransitions.some((transition) => transition.id === transitionId);

    if (isTransitionAvailable) {
      const transitionResponse = await api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}/transitions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transition: {
            id: transitionId,
          },
        }),
      });

      if (transitionResponse.ok) {
        return { message: `Transition for ${issueKey} was executed successfully.` };
      } else {
        throw new Error(`Failed to execute transition. Error code: ${transitionResponse.status}`);
      }
    } else {
      throw new Error(`Transition with ID ${transitionId} is not available for issue ${issueKey}.`);
    }
  } catch (error) {
    console.error('An error occurred while executing the transition:', error);
    return { error: error.message };
  }
});

resolver.define('getProjects', async () => {
  try {
    const response = await api.asApp().requestJira(route`/rest/api/3/project/search`);
    const data = await response.json();
    return data.values;
  } catch (error) {
    console.error('Error while fetching projects:', error);
    return { error: error.message };
  }
});

resolver.define('getIssueTypes', async (req) => {
  const { projectId } = req.payload;
  try {
    const response = await api.asApp().requestJira(route`/rest/api/3/project/${projectId}`);
    const data = await response.json();
    return data.issueTypes;
  } catch (error) {
    console.error('Error while fetching issue types:', error);
    return { error: error.message };
  }
});


resolver.define('getIssueDetails', async (req) => {
  const {issueKey} = req.payload;
  const response = await api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}`);
  const data = await response.json();
  const status = data.fields.status;
  return status;
})
export const handler = resolver.getDefinitions();
