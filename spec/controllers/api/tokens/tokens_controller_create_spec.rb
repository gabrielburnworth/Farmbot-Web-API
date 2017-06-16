require 'spec_helper'

describe Api::TokensController do

  include Devise::Test::ControllerHelpers

  describe '#create' do
    let(:user) { FactoryGirl.create(:user, password: "password") }
    it 'shows required fields' do
      sign_in user
      SmarfDoc.note("No input provided.")
      post :create
      expect(response.status).to eq(422)
    end
    it 'creates a new token' do
      payload = {user: {email: user.email, password: "password"}}
      post :create, params: payload
      token = json[:token][:unencoded]
      expect(token[:iss].last).not_to eq("/") # Trailing slashes are BAD!
      expect(token[:iss]).to include($API_URL)
    end
  end
end
