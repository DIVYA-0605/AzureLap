require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { createClient } = require('contentful-management');

const CONTENTFUL_SPACE_ID = process.env.CONTENTFUL_SPACE_ID;
const CONTENTFUL_ENVIRONMENT_ID = process.env.CONTENTFUL_ENVIRONMENT_ID;
const CONTENTFUL_ACCESS_TOKEN = process.env.CONTENTFUL_ACCESS_TOKEN;

const client = createClient({
  accessToken: CONTENTFUL_ACCESS_TOKEN,
});

const app = express();
app.use(bodyParser.json({ type: 'application/vnd.contentful.management.v1+json' }));

// Helper function to collect unpublished references and assets recursively
async function collectUnpublishedReferences(environment, entry, currentEntities, visitedIds = new Set()) {
  if (visitedIds.has(entry.sys.id)) return currentEntities;
  visitedIds.add(entry.sys.id);

  for (const field in entry.fields) {
    const fieldValue = entry.fields[field]?.['en-US']; // Adjust locale if necessary
    if (Array.isArray(fieldValue)) {
      for (const ref of fieldValue) {
        if (ref.sys?.type === 'Link') {
          if (ref.sys.linkType === 'Entry') {
            const linkedEntry = await environment.getEntry(ref.sys.id);
            currentEntities.push({
              sys: { type: 'Link', linkType: 'Entry', id: ref.sys.id },
            });
            currentEntities = await collectUnpublishedReferences(environment, linkedEntry, currentEntities, visitedIds);
          } else if (ref.sys.linkType === 'Asset') {
            const linkedAsset = await environment.getAsset(ref.sys.id);
            currentEntities.push({
              sys: { type: 'Link', linkType: 'Asset', id: linkedAsset.sys.id },
            });
          }
        }
      }
    } else if (fieldValue?.sys?.type === 'Link') {
      if (fieldValue.sys.linkType === 'Entry') {
        const linkedEntry = await environment.getEntry(fieldValue.sys.id);
        currentEntities.push({
          sys: { type: 'Link', linkType: 'Entry', id: fieldValue.sys.id },
        });
        currentEntities = await collectUnpublishedReferences(environment, linkedEntry, currentEntities, visitedIds);
      } else if (fieldValue.sys.linkType === 'Asset') {
        const linkedAsset = await environment.getAsset(fieldValue.sys.id);
        currentEntities.push({
          sys: { type: 'Link', linkType: 'Asset', id: linkedAsset.sys.id },
        });
      }
    }
  }
  return currentEntities;
}

app.post('/webhook', async (req, res) => {
  const { sys, fields } = req.body;
  const entryId = sys?.id;

  if (!entryId || !fields.workItemId?.['en-US'] || fields.workItemId['en-US'].length === 0) {
    console.error('Missing entryId or workItemId field.');
    return res.status(400).send('Entry is missing required fields.');
  }

  const workItem = fields.workItemId['en-US'][0];
  const state = workItem.state;
  const releaseDate = workItem.releaseDate;

  if (state !== '4.1 - Ready for Release' || !releaseDate) {
    console.log('Entry is not in the "Ready for Release" state or release date is missing. No action taken.');
    return res.status(200).send('No action taken.');
  }

  // Extract only the date portion from releaseDate
  const releaseDateOnly = new Date(releaseDate).toISOString().split('T')[0];

  try {
    const environment = await client
      .getSpace(CONTENTFUL_SPACE_ID)
      .then(space => space.getEnvironment(CONTENTFUL_ENVIRONMENT_ID));

    // Fetch all releases and find one with the given date
    const allReleases = await environment.getReleases();
    let targetRelease = allReleases.items.find(
      release => release.title === `Release - ${releaseDateOnly}`
    );

    // If no release found for the date, create a new release
    if (!targetRelease) {
      targetRelease = await environment.createRelease({
        title: `Release - ${releaseDateOnly}`,
        entities: { items: [] },
      });
      console.log(`Created new release: Release - ${releaseDateOnly}`);
    }

    // Get the entry and its referenced entities and assets
    const entry = await environment.getEntry(entryId);
    let currentEntities = targetRelease.entities?.items || [];
    currentEntities.push({ sys: { type: 'Link', linkType: 'Entry', id: entryId } });

    // Collect unpublished references and assets (including nested ones)
    currentEntities = await collectUnpublishedReferences(environment, entry, currentEntities);

    // Deduplicate entities
    currentEntities = Array.from(new Map(currentEntities.map(item => [item.sys.id, item])).values());

    // Update the release with the new entities
    targetRelease = await targetRelease.update({
      entities: { items: currentEntities },
      title: targetRelease.title,
    });

    console.log(`Entry ${entryId} and its references added to release ${targetRelease.sys.id}`);
    res.status(200).send(`Entry ${entryId} and its references added to release ${targetRelease.sys.id}`);
  } catch (error) {
    console.error(`Failed to process entry ${entryId}:`, error);
    res.status(500).send(`Failed to process entry ${entryId}`);
  }
});


// Start the server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
