require 'spec_helper'
JSON_EXAMPLE = File.read("spec/controllers/api/logs/connor_fixture.json")

describe Api::LogsController do
  include Devise::Test::ControllerHelpers
  let(:user) { FactoryGirl.create(:user) }
  let!(:logs) { FactoryGirl.create_list(:log, 5, device: user.device) }

  describe '#index' do
    it 'lists last x logs' do
      sign_in user
      get :index
      expect(response.status).to eq(200)
      expect(json.first[:id]).to eq(logs.first.id)
      expect(json.first[:created_at]).to eq(logs.first.created_at.to_i)
      expect(json.last[:meta][:type]).to eq(logs.last.meta[:type])
    end
  end

  describe "#create" do
    it 'shows required fields' do
      sign_in user
      SmarfDoc.note("No input provided.")
      payload = {}
      post :create, body: payload.to_json
      expect(response.status).to eq(422)
    end

    it 'creates one log' do
      sign_in user
      before_count = Log.count
      post :create,
           body: { meta: { x: 1, y: 2, z: 3, type: "info" },
                   channels: ["toast"],
                   message: "Hello, world!"
                 }.to_json,
           params: {format: :json}
      expect(response.status).to eq(200)
      expect(Log.count).to be > before_count
      expect(Log.last.message).to eq("Hello, world!")
      expect(Log.last.device).to eq(user.device)
    end

    it 'disallows blacklisted (sensitive) words in logs' do
      Log.destroy_all
      stub = { meta: { x: 1, y: 2, z: 3, type: "info" },
               channels: ["toast"],
               message: "my password is foo123!" }
      sign_in user
      post :create, body: stub.to_json, params: {format: :json}
      expect(json[:log]).to include(Logs::Create::BAD_WORDS)
      expect(response.status).to eq(422)
      expect(Log.count).to eq(0)
    end

    it 'creates many logs (with an Array)' do
      sign_in user
      before_count = Log.count
      post :create,
           body: [
            { meta: { x: 1, y: 2, z: 3, type: "info" },
              channels: ["toast"],
              message: "one" },
            { meta: { x: 1, y: 2, z: 3, type: "info" },
              channels: ["toast"],
              message: "two" },
            { meta: { x: 1, y: 2, z: 3, type: "info" },
              channels: ["toast"],
              message: "three" },
           ].to_json,
           params: {format: :json}
      expect(response.status).to eq(200)
      expect(before_count + 3).to eq(Log.count)
    end

    it 'does not bother saving `fun` logs' do
      sign_in user
      Log.destroy_all
      before_count = Log.count
      dispatch_before = LogDispatch.count
      post :create,
           body: [
            { meta: { x: 1, y: 2, z: 3, type: "info" },
              channels: ["toast"],
              message: "one" },
            { meta: { x: 1, y: 2, z: 3, type: "fun" }, # Ignored
              channels: [],
              message: "two" },
            { meta: { x: 1, y: 2, z: 3, type: "info" },
              channels: ["email"],
              message: "three" },
           ].to_json,
           params: {format: :json}
      expect(response.status).to eq(200)
      expect(before_count + 2).to eq(Log.count)
      expect(dispatch_before + 1).to eq(LogDispatch.count)
    end

    it 'Runs compaction when the logs pile up' do
      stub = {
        meta: { x: 1, y: 2, z: 3, type: "info" }, channels: ["toast"],
              message: "one" }
      payl = []
      100.times { payl.push(stub) }
      sign_in user
      user.device.update_attributes!(max_log_count: 15)
      before_count = Log.count
      post :create, body: payl.to_json, params: {format: :json}
      expect(response.status).to eq(200)
      expect(json.length).to eq(user.device.max_log_count)
    end

    it 'deletes ALL logs' do
      sign_in user
      before = user.device.logs.count
      delete :destroy, params: { id: "all" }
      expect(response.status).to eq(200)
      expect(user.device.reload.logs.count).to be < before
      expect(user.device.logs.count).to eq(0)
    end

    it 'delivers emails for logs marked as `email`' do
      sign_in user
      empty_mail_bag
      before_count = LogDispatch.count
      body         = { meta: { x: 1, y: 2, z: 3, type: "info" },
                       channels: ["email"],
                       message: "Heyoooo" }.to_json
      post :create, body: body, params: {format: :json}
      after_count = LogDispatch.count
      expect(response.status).to eq(200)
      expect(last_email).to be
      expect(last_email.body.to_s).to include("Heyoooo")
      expect(last_email.to).to include(user.email)
      expect(before_count).to be < after_count
      expect(LogDispatch.where(sent_at: nil).count).to eq(0)
    end

    it "batches multiple messages"

    it "handles bug that Connor reported" do
      sign_in user
      empty_mail_bag
      Log.destroy_all
      LogDispatch.destroy_all
      post :create,
           body: JSON_EXAMPLE,
           params: {format: :json}
      expect(last_email).to eq(nil)
    end
  end
end
