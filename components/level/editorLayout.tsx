import React, { useContext, useEffect, useState } from 'react';
import Dimensions from '../../constants/dimensions';
import { LayoutContext } from '../../contexts/layoutContext';
import { PageContext } from '../../contexts/pageContext';
import Control from '../../models/control';
import Level from '../../models/db/level';
import Controls from './controls';
import EditorGrid from './editorGrid';

interface EditorLayoutProps {
  controls?: Control[];
  level: Level;
  onClick?: (index: number, clear: boolean) => void;
}

export default function EditorLayout({ controls, level, onClick }: EditorLayoutProps) {
  const [containerHeight, setContainerHeight] = useState<number>();
  const [containerWidth, setContainerWidth] = useState<number>();
  const { layoutHeight } = useContext(LayoutContext);
  const { windowSize } = useContext(PageContext);

  useEffect(() => {
    // NB: EditorLayout must exist within a div with id 'layout-container'
    const containerDiv = document.getElementById('layout-container');

    setContainerHeight(containerDiv?.offsetHeight);
    setContainerWidth(containerDiv?.offsetWidth);
  }, [layoutHeight, windowSize.height, windowSize.width]);

  if (!containerHeight || !containerWidth) {
    return null;
  }

  // calculate the square size based on the available game space and the level dimensions
  // NB: forcing the square size to be an integer allows the block animations to travel along actual pixels
  const maxHeight = containerHeight - (controls ? Dimensions.ControlHeight : 0);
  const maxWidth = containerWidth;
  const squareSize = level.width / level.height > maxWidth / maxHeight ?
    Math.floor(maxWidth / level.width) : Math.floor(maxHeight / level.height);
  const squareMargin = Math.round(squareSize / 40) || 1;

  return (
    <>
      <div style={{
        display: 'table',
        height: maxHeight,
        width: maxWidth,
      }}>
        <div style={{
          display: 'table-cell',
          height: '100%',
          verticalAlign: 'middle',
          width: '100%',
        }}>
          <div style={{
            alignItems: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}>
            <EditorGrid
              borderWidth={squareMargin}
              level={level}
              onClick={onClick}
              squareSize={squareSize}
            />
          </div>
        </div>
      </div>
      {!controls ? null :
        <div style={{
          bottom: 0,
          display: 'table',
          height: Dimensions.ControlHeight,
          width: maxWidth,
        }}>
          <Controls controls={controls} />
        </div>
      }
    </>
  );
}
