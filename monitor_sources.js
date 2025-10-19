function createDetailedMessage(dvrUrl, serverVersion, sources) {
  let message = `Channels DVR server URL: ${dvrUrl}\n`;
  message += `Channels DVR version: ${serverVersion}\n`;

  const deletedSources = getDeletedSources(sources);
  if (deletedSources && deletedSources.length > 0) {
    message += `\n------------------------------\n\n`;
    for (const sourceName of deletedSources) {
      message += `Deleted source: "${sourceName}"\n`;
    }
  }

  for (const source of sources) {
    if (source.isNew()) {
      message += `\n------------------------------\n\n`;
      const numberOfChannels = Object.keys(source.currentLineup).length;
      message += `New source with ${numberOfChannels} channels: "${source.name}"\n`;
      const fileName = createLocalFileName(source.name);
      if (!source.isEmpty()) {
        message += `See file ${fileName} for the full lineup.\n`;
      }
    } else if (source.hasLineupChanges()) {
      const deletedChannels = source.getDeletedChannelNumbers();
      const addedChannels = source.getAddedChannelNumbers();
      const modifiedChannels = source.getModifiedChannels();
      const removedChannels = source.getRemovedChannelNames();
      const newChannels = source.getNewChannelNames();
      const duplicatedChannels = source.getDuplicateChannels();

      const sortedNames = getSortedChannelNamesFromChannelChanges(removedChannels, newChannels);
      const sortedNumbers = getSortedChannelNumbersFromLineupChanges(deletedChannels, addedChannels, modifiedChannels);

      message += `\n------------------------------\n\n`;

      const channelCountDiff = source.getChannelCountDifference();
      message += `${source.name}: ${Object.keys(source.currentLineup).length} channels (${channelCountDiff})\n`;

      const sourceUrl = getSourceUrl(dvrUrl, source.name);
      if (sourceUrl) {
        message += `(${sourceUrl})\n`;
      }

      if ((removedChannels && Object.keys(removedChannels).length) ||
          (newChannels && Object.keys(newChannels).length) ||
          (duplicatedChannels && Object.keys(duplicatedChannels).length)) {
        if (!source.isEmpty()) {
          const startingChannelNumber = Object.keys(source.currentLineup).sort((a, b) => a - b)[0];
          message += `\n<--- Lineup changes (starting at ${startingChannelNumber}) --->\n`;
        }
      }

      for (const number of sortedNumbers) {
        if (deletedChannels[number]) {
          message += `- ${number} : ${deletedChannels[number].name}\n`;
        }
        if (addedChannels[number]) {
          message += `+ ${number} : ${addedChannels[number].name}\n`;
        }
        if (modifiedChannels[number]) {
          const [oldInfo, newInfo] = modifiedChannels[number];
          message += `! ${number} : ${newInfo.name} (was ${oldInfo.name})\n`;
        }
      }

      if ((removedChannels && Object.keys(removedChannels).length) ||
          (newChannels && Object.keys(newChannels).length)) {
        message += `\n<--- Channel changes --->\n`;
      }

      for (const name of sortedNames) {
        if (removedChannels[name]) {
          message += `- ${name} (${removedChannels[name].number})\n`;
        }
        if (newChannels[name]) {
          message += `+ ${name} (${newChannels[name].number})\n`;
        }
      }

      if (duplicatedChannels && Object.keys(duplicatedChannels).length > 0) {
        message += `\n<--- Duplicated channels --->\n`;
        const sortedDupNames = Object.keys(duplicatedChannels).sort();
        for (const name of sortedDupNames) {
          const channelList = duplicatedChannels[name];
          const sortedNumbers = channelList.map(c => c.number).sort((a, b) => a - b);
          const formattedNumbers = sortedNumbers.join(', ');
          message += `${name}: ${formattedNumbers}\n`;
        }
      }
    }
  }

  return message;
}

async function createSources(dvrUrl) {
  const devicesUrl = `${dvrUrl}/devices`;
  let sources = [];

  try {
    const response = await fetch(devicesUrl);
    const devices = await response.json();

    for (const device of devices) {
      if (device.Lineup) {
        const source = new ChannelsDVRSource(device);

        // These should be async if they fetch or read data
        source.current_lineup = await source.getCurrentLineupFromServer();
        source.previous_lineup = await source.getPreviousLineupFromFile();

        sources.push(source);
      }
    }
  } catch (error) {
    console.error('Error fetching devices:', error);
  }

  return sources;
}

