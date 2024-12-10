require('dotenv').config();
const axios = require('axios');

const { AZURE_DEVOPS_PAT, AZURE_DEVOPS_ORG, AZURE_DEVOPS_PROJECT } = process.env;

// Validate required environment variables
if (!AZURE_DEVOPS_PAT || !AZURE_DEVOPS_ORG || !AZURE_DEVOPS_PROJECT) {
  console.error("Missing required environment variables.");
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

  try {
    if (httpMethod === 'GET' && path === '/.netlify/functions/server/work-items') {
      // Handle `/work-items` endpoint
      const { searchTerm = '', page = 1, perPage = 50 } = queryStringParameters;

      const wiqlQuery = {
        query: `SELECT [System.Id], [System.Title], [System.State] FROM WorkItems WHERE [System.Title] CONTAINS '${searchTerm}' ORDER BY [System.CreatedDate] DESC`,
      };

      const queryResponse = await axiosInstance.post('/wit/wiql?api-version=7.1', wiqlQuery);
      const workItemIds = queryResponse.data.workItems
        .slice((page - 1) * perPage, page * perPage)
        .map((item) => item.id);

      if (workItemIds.length > 0) {
        const workItemsResponse = await axiosInstance.get(
          `/wit/workitems?ids=${workItemIds.join(',')}&fields=System.Id,System.Title,System.State,System.AssignedTo,System.CreatedBy,System.CreatedDate&api-version=7.1`
        );
        return {
          statusCode: 200,
          body: JSON.stringify(workItemsResponse.data.value),
        };
      } else {
        return {
          statusCode: 200,
          body: JSON.stringify([]),
        };
      }
    } else if (httpMethod === 'GET' && path.match(/\/.netlify\/functions\/server\/work-items\/\d+/)) {
      // Handle `/work-items/:id` endpoint
      const id = path.split('/').pop();

      const workItemResponse = await axiosInstance.get(
        `/wit/workitems/${id}?fields=System.Id,System.Title,System.State,System.AssignedTo,System.CreatedBy,System.CreatedDate&api-version=7.1`
      );

      return {
        statusCode: 200,
        body: JSON.stringify(workItemResponse.data),
      };
    } else if (httpMethod === 'GET' && path.match(/\/.netlify\/functions\/server\/work-items\/fetch-self\/\d+/)) {
      // Handle `/work-items/fetch-self/:id` endpoint
      const id = path.split('/').pop();

      const initialResponse = await axiosInstance.get(
        `/wit/workitems/${id}?fields=System.Id,System.Title,System.State&api-version=7.1`
      );

      const selfLink = initialResponse.data._links.self.href;

      const selfResponse = await axios.get(selfLink, {
        headers: {
          Authorization: `Basic ${Buffer.from(`:${AZURE_DEVOPS_PAT}`).toString('base64')}`,
        },
      });

      return {
        statusCode: 200,
        body: JSON.stringify(selfResponse.data),
      };
    } else {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Route not found.' }),
      };
    }
  } catch (error) {
    console.error('Error:', error.message || error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};
