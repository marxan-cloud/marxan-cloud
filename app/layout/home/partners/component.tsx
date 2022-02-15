import React from 'react';

import Carousel from 'components/carousel';

import { PARTNER_LOGOS } from './constants';

export interface PartnersListProps {

}

export const PartnersList: React.FC<PartnersListProps> = () => {
  return (
    <div className="pt-24 pb-6 bg-primary-50">

      <div className="max-w-5xl mx-auto">
        <Carousel
          slides={PARTNER_LOGOS.map((pl) => {
            const { id, title, logos } = pl;
            return {
              id,
              content: (
                <>
                  <p className="text-2xl text-black font-heading">
                    {title}
                  </p>
                  <div className="grid w-full grid-cols-4 py-14 gap-x-20">
                    {logos.map((logo) => {
                      const {
                        id: logoId, alt, hyperlink, src,
                      } = logo;
                      return (
                        <a href={hyperlink} key={logoId} rel="noreferrer" target="_blank" className="place-self-center">
                          <img className="max-h-12" alt={alt} src={src} height="auto" width="auto" />
                        </a>
                      );
                    })}
                  </div>
                </>
              ),
            };
          })}
        />
      </div>

    </div>
  );
};

export default PartnersList;
