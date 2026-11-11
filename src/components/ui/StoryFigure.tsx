import React from 'react';
import type { StoryImage } from '../../lib/news';

/** Foto da notícia com o crédito e a licença, como pedem as licenças Creative Commons. */
export const StoryFigure: React.FC<{ image: StoryImage; priority?: boolean; className?: string }> = ({
  image,
  priority,
  className,
}) => (
  <figure className={`story-figure ${className ?? ''}`}>
    <img
      src={image.url}
      alt={image.alt}
      width={image.width ?? 960}
      height={image.height ?? 540}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      referrerPolicy="no-referrer"
      {...(priority ? { fetchPriority: 'high' as const } : {})}
    />
    {(image.credit || image.license) && (
      <figcaption>
        {image.credit && (
          <>
            Foto:{' '}
            {image.sourceUrl ? (
              <a href={image.sourceUrl} target="_blank" rel="noopener noreferrer">
                {image.credit}
              </a>
            ) : (
              image.credit
            )}
          </>
        )}
        {image.license && (
          <>
            {image.credit ? ', ' : ''}
            {image.licenseUrl ? (
              <a href={image.licenseUrl} target="_blank" rel="noopener noreferrer">
                {image.license}
              </a>
            ) : (
              image.license
            )}
          </>
        )}
      </figcaption>
    )}
  </figure>
);
