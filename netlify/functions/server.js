require('dotenv').config();
const axios = require('axios');

const { AZURE_DEVOPS_PAT, AZURE_DEVOPS_ORG, AZURE_DEVOPS_PROJECT } = process.env;

// Validate required environment variables
if (!AZURE_DEVOPS_PAT || !AZURE_DEVOPS_ORG || !AZURE_DEVOPS_PROJECT) {
  console.error("Missing required environment variables:", {
    AZURE_DEVOPS_PAT: !!AZURE_DEVOPS_PAT,
    AZURE_DEVOPS_ORG: !!AZURE_DEVOPS_ORG,
    AZURE_DEVOPS_PROJECT: !!AZURE_DEVOPS_PROJECT,
  });
  process.exit(1);
}

// Initialize Axios instance
const axiosInstance = axios.create({
  baseURL: `https://bofaz.visualstudio.com/${AZURE_DEVOPS_PROJECT}/_apis`,
  headers: {
    Authorization: `Basic ${Buffer.from(`:${AZURE_DEVOPS_PAT}`).toString('base64')}`,
  },
});

exports.handler = async (event) => {
  const { httpMethod, path, queryStringParameters, body } = event;
  console.log("Incoming Request:", { httpMethod, path, queryStringParameters, body });

  try {
    if (httpMethod === 'GET' && path === '/.netlify/functions/server/work-items') {
      console.log("Fetching work items...");
      const { searchTerm = '', page = 1, perPage = 50 } = queryStringParameters;

      const wiqlQuery = {
        query: `SELECT [System.Id], [System.Title], [System.State] FROM WorkItems WHERE [System.Title] CONTAINS '${searchTerm}' ORDER BY [System.CreatedDate] DESC`,
      };

      console.log("WIQL Query:", wiqlQuery);

      const queryResponse = await axiosInstance.post('/wit/wiql?api-version=7.1', wiqlQuery);
      console.log("WIQL Query Response:", queryResponse.data);

      const workItemIds = queryResponse.data.workItems
        .slice((page - 1) * perPage, page * perPage)
        .map((item) => item.id);

      console.log("Fetched Work Item IDs:", workItemIds);

      if (workItemIds.length > 0) {
        const workItemsResponse = await axiosInstance.get(
          `/wit/workitems?ids=${workItemIds.join(',')}&fields=System.Id,System.Title,System.State,System.AssignedTo,System.CreatedBy,System.CreatedDate&api-version=7.1`
        );
        console.log("Work Items Details Response:", workItemsResponse.data);

        return {
          statusCode: 200,
          body: JSON.stringify(workItemsResponse.data.value),
        };
      } else {
        console.log("No Work Items Found.");
        return {
          statusCode: 200,
          body: JSON.stringify([]),
        };
      }
    } else if (httpMethod === 'GET' && path.match(/\/.netlify\/functions\/server\/work-items\/\d+/)) {
      console.log("Fetching single work item details...");
      const id = path.split('/').pop();
      console.log("Work Item ID:", id);

      const workItemResponse = await axiosInstance.get(
        `/wit/workitems/${id}?fields=System.Id,System.Title,System.State,System.AssignedTo,System.CreatedBy,System.CreatedDate&api-version=7.1`
      );

      console.log("Work Item Details Response:", workItemResponse.data);
      return {
        statusCode: 200,
        body: JSON.stringify(workItemResponse.data),
      };
    } else if (httpMethod === 'GET' && path.match(/\/.netlify\/functions\/server\/work-items\/fetch-self\/\d+/)) {
      console.log("Fetching data from self link...");
      const id = path.split('/').pop();
      console.log("Work Item ID:", id);

      const initialResponse = await axiosInstance.get(
        `/wit/workitems/${id}?fields=System.Id,System.Title,System.State&api-version=7.1`
      );
      console.log("Initial Work Item Response:", initialResponse.data);

      const selfLink = initialResponse.data._links.self.href;
      console.log("Self Link URL:", selfLink);

      const selfResponse = await axios.get(selfLink, {
        headers: {
          Authorization: `Basic ${Buffer.from(`:${AZURE_DEVOPS_PAT}`).toString('base64')}`,
        },
      });

      console.log("Self Link Response:", selfResponse.data);
      return {
        statusCode: 200,
        body: JSON.stringify(selfResponse.data),
      };
    } else {
      console.log("Route not found.");
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Route not found.' }),
      };
    }
  } catch (error) {
    console.error("Error in handler:", {
      message: error.message,
      stack: error.stack,
      response: error.response ? error.response.data : null,
    });
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};
